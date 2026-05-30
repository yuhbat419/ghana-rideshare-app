const { body, query } = require('express-validator');

const createJobValidator = [
  body('pickupAddress')
    .trim()
    .notEmpty().withMessage('Pickup address is required'),

  body('pickupLat')
    .notEmpty().withMessage('Pickup latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  body('pickupLng')
    .notEmpty().withMessage('Pickup longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  body('dropoffAddress')
    .trim()
    .notEmpty().withMessage('Dropoff address is required'),

  body('dropoffLat')
    .notEmpty().withMessage('Dropoff latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  body('dropoffLng')
    .notEmpty().withMessage('Dropoff longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Notes cannot exceed 200 characters'),

  body('scheduledAt')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];

const rateJobValidator = [
  body('score')
    .notEmpty().withMessage('Score is required')
    .isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Comment cannot exceed 300 characters'),
];

const cancelJobValidator = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Cancellation reason is required')
    .isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters'),
];

module.exports = {
  createJobValidator,
  rateJobValidator,
  cancelJobValidator,
};