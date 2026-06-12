const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const driverController = require('../controllers/driver.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public: get online drivers
router.get('/online', authenticate, driverController.getOnlineDrivers);

// Driver: toggle availability
router.patch('/availability', authenticate, authorize('DRIVER'), driverController.toggleAvailability);

// Driver: update location
router.patch('/location', authenticate, authorize('DRIVER'), driverController.updateLocation);

// Driver: get my profile
router.get('/profile', authenticate, authorize('DRIVER'), driverController.getMyProfile);

// Driver: get my rides
router.get('/rides', authenticate, authorize('DRIVER'), driverController.getMyRides);

// Driver: get dashboard stats
router.get('/dashboard', authenticate, authorize('DRIVER'), driverController.getDashboard);

// Driver: complete onboarding (create driver profile)
router.post('/onboard',
  authenticate,
  authorize('DRIVER'),
  [
    body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('vehicleType').optional(),
  ],
  driverController.onboard
);

module.exports = router;
