const { createNotification } = require('../services/notification.service');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate fare based on distance (Ghana pricing)
const calculateFare = (distanceKm) => {
  const baseFare = 5.0;       // GHS 5 base fare
  const perKmRate = 3.5;      // GHS 3.50 per km
  const minimumFare = 8.0;    // GHS 8 minimum
  const fare = baseFare + distanceKm * perKmRate;
  return Math.max(fare, minimumFare).toFixed(2);
};

// @route   POST /api/v1/jobs
const createJob = async (req, res, next) => {
  try {
    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      notes,
      scheduledAt,
    } = req.body;

    // Calculate distance and fare
    const distanceKm = calculateDistance(
      parseFloat(pickupLat),
      parseFloat(pickupLng),
      parseFloat(dropoffLat),
      parseFloat(dropoffLng)
    );

    const estimatedPrice = calculateFare(distanceKm);

    const job = await prisma.job.create({
      data: {
        customerId: req.user.id,
        pickupAddress,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        dropoffAddress,
        dropoffLat: parseFloat(dropoffLat),
        dropoffLng: parseFloat(dropoffLng),
        estimatedPrice,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        notes: notes || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`New job created: ${job.id} by customer ${req.user.id}`);

    // Notify customer
await createNotification(
  job.customerId,
  'JOB_ASSIGNED',
  'Driver found! 🚗',
  `Your driver is on the way to pick you up.`,
  { jobId: job.id }
);

    return successResponse(res, 'Job created successfully', job, 201);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/jobs
const getMyJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const where = {
      customerId: req.user.id,
      ...(status && { status }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
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
          vehicle: true,
          ratings: true,
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

// @route   GET /api/v1/jobs/available
const getAvailableJobs = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    if (driver.status !== 'APPROVED') {
      return errorResponse(res, 'Your account must be approved to view jobs', 403, null, 'NOT_APPROVED');
    }

    const jobs = await prisma.job.findMany({
      where: { status: 'PENDING' },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return successResponse(res, 'Available jobs retrieved', jobs);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        customer: {
          select: {
            id: true,
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
        vehicle: true,
        transaction: true,
        ratings: true,
      },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    // Only customer or assigned driver can view job
    const isCustomer = job.customerId === req.user.id;
    const isDriver = job.driver?.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isDriver && !isAdmin) {
      return errorResponse(res, 'Access denied', 403, null, 'FORBIDDEN');
    }

    return successResponse(res, 'Job retrieved', job);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/jobs/:id/accept
const acceptJob = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
      include: { vehicles: { where: { isActive: true } } },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    if (driver.status !== 'APPROVED') {
      return errorResponse(res, 'Your account must be approved', 403, null, 'NOT_APPROVED');
    }

    if (driver.vehicles.length === 0) {
      return errorResponse(res, 'You must have an active vehicle to accept jobs', 400, null, 'NO_VEHICLE');
    }

    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    if (job.status !== 'PENDING') {
      return errorResponse(res, 'This job is no longer available', 400, null, 'JOB_NOT_AVAILABLE');
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        driverId: driver.id,
        vehicleId: driver.vehicles[0].id,
        status: 'ASSIGNED',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        vehicle: true,
      },
    });

    logger.info(`Job ${job.id} accepted by driver ${driver.id}`);

    return successResponse(res, 'Job accepted successfully', updatedJob);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/jobs/:id/start
const startJob = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    if (job.driverId !== driver.id) {
      return errorResponse(res, 'You are not assigned to this job', 403, null, 'FORBIDDEN');
    }

    if (job.status !== 'ASSIGNED') {
      return errorResponse(res, 'Job cannot be started', 400, null, 'INVALID_STATUS');
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return successResponse(res, 'Trip started', updatedJob);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/jobs/:id/complete
const completeJob = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    if (job.driverId !== driver.id) {
      return errorResponse(res, 'You are not assigned to this job', 403, null, 'FORBIDDEN');
    }

    if (job.status !== 'IN_PROGRESS') {
      return errorResponse(res, 'Job cannot be completed', 400, null, 'INVALID_STATUS');
    }

    // Update job and driver stats in a transaction
    const [updatedJob] = await prisma.$transaction([
      prisma.job.update({
        where: { id: req.params.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          finalPrice: job.estimatedPrice,
        },
      }),
      prisma.driver.update({
        where: { id: driver.id },
        data: { totalTrips: { increment: 1 } },
      }),
      prisma.transaction.create({
        data: {
          jobId: job.id,
          customerId: job.customerId,
          amount: job.estimatedPrice,
          method: 'CASH',
          status: 'SUCCESS',
          platformFee: (parseFloat(job.estimatedPrice) * 0.15).toFixed(2),
          driverPayout: (parseFloat(job.estimatedPrice) * 0.85).toFixed(2),
          paidAt: new Date(),
        },
      }),
    ]);

    logger.info(`Job ${job.id} completed by driver ${driver.id}`);

    // Notify customer
await createNotification(
  job.customerId,
  'TRIP_COMPLETED',
  'Trip completed! ✅',
  `Your trip has been completed. Total: GHS ${job.estimatedPrice}`,
  { jobId: job.id }
);

    return successResponse(res, 'Trip completed successfully', updatedJob);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/jobs/:id/cancel
const cancelJob = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    const isCustomer = job.customerId === req.user.id;
    const isDriver = req.user.role === 'DRIVER';

    if (!isCustomer && !isDriver) {
      return errorResponse(res, 'Access denied', 403, null, 'FORBIDDEN');
    }

    if (!['PENDING', 'ASSIGNED'].includes(job.status)) {
      return errorResponse(res, 'This job cannot be cancelled', 400, null, 'CANNOT_CANCEL');
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    return successResponse(res, 'Job cancelled', updatedJob);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/jobs/:id/rate
const rateJob = async (req, res, next) => {
  try {
    const { score, comment } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { driver: true },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

    if (job.status !== 'COMPLETED') {
      return errorResponse(res, 'You can only rate completed trips', 400, null, 'JOB_NOT_COMPLETED');
    }

    const isCustomer = job.customerId === req.user.id;
    const isDriver = job.driver?.userId === req.user.id;

    if (!isCustomer && !isDriver) {
      return errorResponse(res, 'Access denied', 403, null, 'FORBIDDEN');
    }

    // Determine who is being rated
    const ratedUserId = isCustomer ? job.driver.userId : job.customerId;

    // Check if already rated
    const existingRating = await prisma.rating.findUnique({
      where: {
        jobId_ratedById: {
          jobId: job.id,
          ratedById: req.user.id,
        },
      },
    });

    if (existingRating) {
      return errorResponse(res, 'You have already rated this trip', 400, null, 'ALREADY_RATED');
    }

    const rating = await prisma.rating.create({
      data: {
        jobId: job.id,
        ratedById: req.user.id,
        ratedUserId,
        score: parseInt(score),
        comment: comment || null,
      },
    });

    // Update driver average rating
    if (isCustomer && job.driver) {
      const ratings = await prisma.rating.findMany({
        where: { ratedUserId: job.driver.userId },
        select: { score: true },
      });

      const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

      await prisma.driver.update({
        where: { id: job.driver.id },
        data: { avgRating: parseFloat(avgRating.toFixed(1)) },
      });
    }

    return successResponse(res, 'Rating submitted successfully', rating, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getMyJobs,
  getAvailableJobs,
  getJobById,
  acceptJob,
  startJob,
  completeJob,
  cancelJob,
  rateJob,
};