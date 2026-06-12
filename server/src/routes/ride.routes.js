const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Passenger: request a ride
router.post('/request',
  authenticate,
  authorize('PASSENGER', 'ADMIN'),
  [
    body('pickupLocation').notEmpty().withMessage('Pickup location is required'),
    body('dropLocation').notEmpty().withMessage('Drop location is required'),
  ],
  rideController.requestRide
);

// Passenger: get my ride history
router.get('/my-rides', authenticate, rideController.getMyRides);

// Passenger: cancel a ride
router.patch('/:id/cancel', authenticate, rideController.cancelRide);

// Driver: accept a ride
router.patch('/:id/accept', authenticate, authorize('DRIVER'), rideController.acceptRide);

// Driver: reject a ride
router.patch('/:id/reject', authenticate, authorize('DRIVER'), rideController.rejectRide);

// Driver: start a ride
router.patch('/:id/start', authenticate, authorize('DRIVER'), rideController.startRide);

// Driver: complete a ride
router.patch('/:id/complete', authenticate, authorize('DRIVER'), rideController.completeRide);

// Get single ride details
router.get('/:id', authenticate, rideController.getRideById);

// Admin: get all rides
router.get('/', authenticate, authorize('ADMIN'), rideController.getAllRides);

module.exports = router;
