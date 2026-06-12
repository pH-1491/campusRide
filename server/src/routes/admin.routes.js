const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const isAdmin = [authenticate, authorize('ADMIN')];

router.get('/users', isAdmin, adminController.getAllUsers);
router.get('/drivers', isAdmin, adminController.getAllDrivers);
router.patch('/drivers/:id/verify', isAdmin, adminController.verifyDriver);
router.patch('/drivers/:id/unverify', isAdmin, adminController.unverifyDriver);
router.get('/rides', isAdmin, adminController.getAllRides);
router.delete('/users/:id', isAdmin, adminController.deleteUser);

module.exports = router;
