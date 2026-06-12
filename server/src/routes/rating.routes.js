const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ratingController = require('../controllers/rating.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/',
  authenticate,
  authorize('PASSENGER'),
  [
    body('rideId').notEmpty().withMessage('Ride ID is required'),
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
    body('feedback').optional().isString(),
  ],
  ratingController.submitRating
);

router.get('/driver/:driverId', authenticate, ratingController.getDriverRatings);

module.exports = router;
