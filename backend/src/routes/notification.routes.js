const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');

router.use(authenticate);

// Get all notifications for current user
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
});

// Mark single notification as read
router.put('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return successResponse(res, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return successResponse(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return successResponse(res, 'Unread count', { count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;