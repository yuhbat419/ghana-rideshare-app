const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createJobValidator,
  rateJobValidator,
  cancelJobValidator,
} = require('../validators/job.validator');

router.use(authenticate);

// Customer routes
router.post('/', authorize('CUSTOMER'), createJobValidator, validate, jobController.createJob);
router.get('/', authorize('CUSTOMER'), jobController.getMyJobs);

// Driver routes
router.get('/available', authorize('DRIVER'), jobController.getAvailableJobs);
router.put('/:id/accept', authorize('DRIVER'), jobController.acceptJob);
router.put('/:id/start', authorize('DRIVER'), jobController.startJob);
router.put('/:id/complete', authorize('DRIVER'), jobController.completeJob);

// Shared routes
router.get('/:id', jobController.getJobById);
router.put('/:id/cancel', cancelJobValidator, validate, jobController.cancelJob);
router.post('/:id/rate', rateJobValidator, validate, jobController.rateJob);

module.exports = router;