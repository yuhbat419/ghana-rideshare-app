const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { errorResponse } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401, null, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 401, null, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account has been suspended', 403, null, 'ACCOUNT_SUSPENDED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired', 401, null, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401, null, 'INVALID_TOKEN');
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        'You do not have permission to perform this action',
        403,
        null,
        'FORBIDDEN'
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };