const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Generate tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, role = 'CUSTOMER' } = req.body;

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return errorResponse(res, 'Phone number already registered', 409, null, 'PHONE_EXISTS');
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 'Email already registered', 409, null, 'EMAIL_EXISTS');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for phone verification
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // If driver, create driver profile
    if (role === 'DRIVER') {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: `TEMP-${user.id.slice(0, 8).toUpperCase()}`,
        },
      });
    }

    // TODO: Send OTP via Africa's Talking SMS
    // For now, log it (remove in production)
    logger.info(`OTP for ${phone}: ${otp} (expires: ${otpExpiry})`);

    return successResponse(
      res,
      'Registration successful. Please verify your phone number.',
      { user, otp }, // Remove otp from response in production
      201
    );
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return errorResponse(res, 'Invalid phone number or password', 401, null, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 'Your account has been suspended', 403, null, 'ACCOUNT_SUSPENDED');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid phone number or password', 401, null, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, 'Login successful', {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/verify-phone
const verifyPhone = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // TODO: Verify OTP from database/cache
    // For now, accept "123456" as test OTP
    if (otp !== '123456') {
      return errorResponse(res, 'Invalid or expired OTP', 400, null, 'INVALID_OTP');
    }

    await prisma.user.update({
      where: { phone },
      data: { isVerified: true },
    });

    return successResponse(res, 'Phone number verified successfully');
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return errorResponse(res, 'Refresh token required', 401, null, 'NO_REFRESH_TOKEN');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid refresh token', 401, null, 'INVALID_REFRESH_TOKEN');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 'Token refreshed', { accessToken });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        driver: {
          select: {
            id: true,
            status: true,
            isOnline: true,
            avgRating: true,
            totalTrips: true,
          },
        },
      },
    });

    return successResponse(res, 'User profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/logout
const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return successResponse(res, 'Logged out successfully');
};

module.exports = { register, login, verifyPhone, refreshToken, getMe, logout };