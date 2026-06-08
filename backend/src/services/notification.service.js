const prisma = require('../config/database');
const logger = require('../utils/logger');

const createNotification = async (userId, type, title, message, metadata = null) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata,
      },
    });
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
  }
};

module.exports = { createNotification };