const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

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

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, role = 'CUSTOMER' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return errorResponse(res, 'Phone number already registered', 409, null, 'PHONE_EXISTS');
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 'Email already registered', 409, null, 'EMAIL_EXISTS');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

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

    if (role === 'DRIVER') {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: `TEMP-${user.id.slice(0, 8).toUpperCase()}`,
        },
      });
    }

    // Save OTP to database
    await prisma.otp.create({
      data: {
        phone,
        otp,
        expiresAt: otpExpiry,
      },
    });

    logger.info(`OTP for ${phone}: ${otp}`);

    return successResponse(
      res,
      'Registration successful. Please verify your phone number.',
      { user },
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return errorResponse(res, 'Invalid phone number or password', 401, null, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been suspended', 403, null, 'ACCOUNT_SUSPENDED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid phone number or password', 401, null, 'INVALID_CREDENTIALS');
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

const verifyPhone = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return errorResponse(res, 'Invalid or expired OTP', 400, null, 'INVALID_OTP');
    }

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    await prisma.user.update({
      where: { phone },
      data: { isVerified: true },
    });

    return successResponse(res, 'Phone number verified successfully');
  } catch (error) {
    next(error);
  }
};

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

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return successResponse(res, 'Logged out successfully');
};
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: req.user.id } },
      });
      if (existing) {
        return errorResponse(res, 'Email already in use', 409, null, 'EMAIL_EXISTS');
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email: email || null }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    return successResponse(res, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return errorResponse(res, 'Current password is incorrect', 400, null, 'WRONG_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
module.exports = { register, login, verifyPhone, refreshToken, getMe, logout, updateProfile, changePassword };