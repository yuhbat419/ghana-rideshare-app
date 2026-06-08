const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  updateProfileValidator,
  addVehicleValidator,
} = require('../validators/driver.validator');

router.use(authenticate);
router.use(authorize('DRIVER'));

router.get('/profile', driverController.getProfile);
router.put('/profile', updateProfileValidator, validate, driverController.updateProfile);
router.get('/vehicles', driverController.getVehicles);
router.post('/vehicles', addVehicleValidator, validate, driverController.addVehicle);
router.put('/toggle-online', driverController.toggleOnline);
router.put('/location', driverController.updateLocation);
router.get('/earnings', driverController.getEarnings);
router.get('/active-job', driverController.getActiveJob);

module.exports = router;