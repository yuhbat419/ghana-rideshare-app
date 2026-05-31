const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/suspend', adminController.suspendUser);
router.get('/drivers', adminController.getAllDrivers);
router.put('/drivers/:id/approve', adminController.approveDriver);
router.put('/drivers/:id/reject', adminController.rejectDriver);
router.put('/drivers/:id/suspend', adminController.suspendDriver);
router.get('/jobs', adminController.getAllJobs);
router.get('/reports', adminController.getReports);

module.exports = router;