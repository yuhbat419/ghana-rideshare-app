const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @route   GET /api/v1/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDrivers,
      totalJobs,
      completedJobs,
      totalRevenue,
      pendingDrivers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.driver.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.transaction.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { platformFee: true },
      }),
      prisma.driver.count({ where: { status: 'PENDING' } }),
    ]);

    return successResponse(res, 'Stats retrieved', {
      totalCustomers: totalUsers,
      totalDrivers,
      totalJobs,
      completedJobs,
      pendingApprovals: pendingDrivers,
      totalRevenue: totalRevenue._sum.platformFee || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/drivers
const getAllDrivers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const where = {
      ...(status && { status }),
    };

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              isVerified: true,
              createdAt: true,
            },
          },
          vehicles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    return successResponse(res, 'Drivers retrieved', drivers, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/admin/drivers/:id/approve
const approveDriver = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    if (driver.status === 'APPROVED') {
      return errorResponse(res, 'Driver is already approved', 400, null, 'ALREADY_APPROVED');
    }

    await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });

    logger.info(`Driver ${driver.id} approved by admin ${req.user.id}`);

    // TODO: Send SMS notification to driver
    // await smsService.send(driver.user.phone, 'Your account has been approved!');

    return successResponse(res, `Driver ${driver.user.firstName} approved successfully`);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/admin/drivers/:id/reject
const rejectDriver = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });

    logger.info(`Driver ${driver.id} rejected by admin ${req.user.id}. Reason: ${reason}`);

    return successResponse(res, `Driver ${driver.user.firstName} rejected`);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/admin/drivers/:id/suspend
const suspendDriver = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.driver.update({
        where: { id: req.params.id },
        data: { status: 'SUSPENDED', isOnline: false },
      }),
      prisma.user.update({
        where: { id: driver.userId },
        data: { isActive: false },
      }),
    ]);

    logger.info(`Driver ${driver.id} suspended by admin ${req.user.id}. Reason: ${reason}`);

    return successResponse(res, `Driver ${driver.user.firstName} suspended`);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role;

    const where = {
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse(res, 'Users retrieved', users, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/jobs
const getAllJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const where = {
      ...(status && { status }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return successResponse(res, 'Jobs retrieved', jobs, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/reports
const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count(),
    ]);

    return successResponse(res, 'Reports retrieved', reports, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404, null, 'USER_NOT_FOUND');
    }

    if (user.role === 'ADMIN') {
      return errorResponse(res, 'Cannot suspend an admin account', 403, null, 'FORBIDDEN');
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    logger.info(`User ${user.id} suspended by admin ${req.user.id}`);

    return successResponse(res, `User ${user.firstName} suspended`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAllDrivers,
  approveDriver,
  rejectDriver,
  suspendDriver,
  getAllUsers,
  getAllJobs,
  getReports,
  suspendUser,
};