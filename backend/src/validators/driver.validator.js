const { body } = require('express-validator');

const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('email')
    .optional()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
];

const updateDriverValidator = [
  body('licenseNumber')
    .optional()
    .trim()
    .notEmpty().withMessage('License number cannot be empty'),
];

const addVehicleValidator = [
  body('make')
    .trim()
    .notEmpty().withMessage('Vehicle make is required')
    .isLength({ min: 2, max: 50 }).withMessage('Make must be 2-50 characters'),

  body('model')
    .trim()
    .notEmpty().withMessage('Vehicle model is required')
    .isLength({ min: 1, max: 50 }).withMessage('Model must be 1-50 characters'),

  body('year')
    .notEmpty().withMessage('Vehicle year is required')
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Enter a valid vehicle year'),

  body('plateNumber')
    .trim()
    .notEmpty().withMessage('Plate number is required')
    .toUpperCase(),

  body('color')
    .trim()
    .notEmpty().withMessage('Vehicle color is required'),

  body('type')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['SEDAN', 'SUV', 'TRICYCLE', 'MINIVAN', 'PICKUP'])
    .withMessage('Invalid vehicle type'),
];

module.exports = {
  updateProfileValidator,
  updateDriverValidator,
  addVehicleValidator,
};