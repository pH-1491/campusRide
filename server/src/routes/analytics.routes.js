const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/overview', authenticate, authorize('ADMIN'), analyticsController.getOverview);
router.get('/rides-trend', authenticate, authorize('ADMIN'), analyticsController.getRidesTrend);
router.get('/peak-hours', authenticate, authorize('ADMIN'), analyticsController.getPeakHours);
router.get('/popular-locations', authenticate, authorize('ADMIN'), analyticsController.getPopularLocations);
router.get('/driver-stats', authenticate, authorize('ADMIN'), analyticsController.getDriverStats);

module.exports = router;
