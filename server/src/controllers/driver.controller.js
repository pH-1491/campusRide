const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

exports.onboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { vehicleNumber, licenseNumber, vehicleType } = req.body;

    const existing = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Driver profile already exists' });
    }

    const driver = await prisma.driver.create({
      data: {
        userId: req.user.id,
        vehicleNumber,
        licenseNumber,
        vehicleType: vehicleType || 'E-Rickshaw',
      },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    res.status(201).json({ success: true, driver });
  } catch (error) {
    console.error('Onboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found. Please complete onboarding.' });
    }
    if (!driver.isVerified) {
      return res.status(403).json({ success: false, message: 'Your account is pending verification by admin.' });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: !driver.isOnline },
      include: { user: { select: { name: true, email: true } } },
    });

    // Emit to all connected clients
    if (updatedDriver.isOnline) {
      req.io.emit('driver:online', {
        driverId: updatedDriver.id,
        name: updatedDriver.user.name,
        vehicleNumber: updatedDriver.vehicleNumber,
        vehicleType: updatedDriver.vehicleType,
        currentLat: updatedDriver.currentLat,
        currentLng: updatedDriver.currentLng,
        averageRating: updatedDriver.averageRating,
      });
    } else {
      req.io.emit('driver:offline', { driverId: updatedDriver.id });
    }

    res.json({ success: true, driver: updatedDriver });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { currentLat: lat, currentLng: lng },
    });

    req.io.emit('driver:location', { driverId: driver.id, lat, lng });

    res.json({ success: true, driver: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        ratingsReceived: {
          include: { giver: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const rides = await prisma.ride.findMany({
      where: { driverId: driver.id },
      include: {
        passenger: { select: { name: true, phone: true } },
        rating: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const [totalRides, completedRides, cancelledRides, activeRide, recentRides, ratings] = await Promise.all([
      prisma.ride.count({ where: { driverId: driver.id } }),
      prisma.ride.count({ where: { driverId: driver.id, status: 'COMPLETED' } }),
      prisma.ride.count({ where: { driverId: driver.id, status: 'CANCELLED' } }),
      prisma.ride.findFirst({
        where: { driverId: driver.id, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
        include: { passenger: { select: { name: true, phone: true } } },
      }),
      prisma.ride.findMany({
        where: { driverId: driver.id },
        include: {
          passenger: { select: { name: true } },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.rating.findMany({
        where: { driverId: driver.id },
        include: { giver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      dashboard: {
        driver,
        stats: {
          totalRides,
          completedRides,
          cancelledRides,
          averageRating: driver.averageRating,
          isOnline: driver.isOnline,
        },
        activeRide,
        recentRides,
        recentRatings: ratings,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOnlineDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { isOnline: true, isVerified: true },
      include: { user: { select: { name: true, phone: true } } },
    });
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
