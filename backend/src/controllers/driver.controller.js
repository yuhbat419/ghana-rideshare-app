const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @route   GET /api/v1/drivers/profile
const getProfile = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
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
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    return successResponse(res, 'Driver profile retrieved', driver);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/drivers/profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, licenseNumber } = req.body;

    // Update user info
    if (firstName || lastName || email) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
        },
      });
    }

    // Update driver info
    if (licenseNumber) {
      const existingLicense = await prisma.driver.findFirst({
        where: {
          licenseNumber,
          userId: { not: req.user.id },
        },
      });

      if (existingLicense) {
        return errorResponse(res, 'License number already registered', 409, null, 'LICENSE_EXISTS');
      }

      await prisma.driver.update({
        where: { userId: req.user.id },
        data: { licenseNumber },
      });
    }

    const updatedDriver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return successResponse(res, 'Profile updated successfully', updatedDriver);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/drivers/vehicles
const addVehicle = async (req, res, next) => {
  try {
    const { make, model, year, plateNumber, color, type } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    // Check plate number is unique
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
    });

    if (existingVehicle) {
      return errorResponse(res, 'Plate number already registered', 409, null, 'PLATE_EXISTS');
    }

    // Deactivate other vehicles
    await prisma.vehicle.updateMany({
      where: { driverId: driver.id },
      data: { isActive: false },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId: driver.id,
        make,
        model,
        year: parseInt(year),
        plateNumber: plateNumber.toUpperCase(),
        color,
        type,
        isActive: true,
      },
    });

    return successResponse(res, 'Vehicle added successfully', vehicle, 201);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/drivers/vehicles
const getVehicles = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Vehicles retrieved', vehicles);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/drivers/toggle-online
const toggleOnline = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    if (driver.status !== 'APPROVED') {
      return errorResponse(
        res,
        'Your account must be approved before going online',
        403,
        null,
        'ACCOUNT_NOT_APPROVED'
      );
    }

    const updatedDriver = await prisma.driver.update({
      where: { userId: req.user.id },
      data: {
        isOnline: !driver.isOnline,
        ...(latitude && { currentLat: parseFloat(latitude) }),
        ...(longitude && { currentLng: parseFloat(longitude) }),
      },
    });

    return successResponse(
      res,
      updatedDriver.isOnline ? 'You are now online' : 'You are now offline',
      { isOnline: updatedDriver.isOnline }
    );
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/drivers/location
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'Latitude and longitude are required', 400, null, 'MISSING_LOCATION');
    }

    await prisma.driver.update({
      where: { userId: req.user.id },
      data: {
        currentLat: parseFloat(latitude),
        currentLng: parseFloat(longitude),
      },
    });

    return successResponse(res, 'Location updated');
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/drivers/earnings
const getEarnings = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404, null, 'DRIVER_NOT_FOUND');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        job: { driverId: driver.id },
        status: 'SUCCESS',
      },
      include: {
        job: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarnings = transactions.reduce(
      (sum, t) => sum + parseFloat(t.driverPayout),
      0
    );

    return successResponse(res, 'Earnings retrieved', {
      totalEarnings: totalEarnings.toFixed(2),
      totalTrips: driver.totalTrips,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addVehicle,
  getVehicles,
  toggleOnline,
  updateLocation,
  getEarnings,
};