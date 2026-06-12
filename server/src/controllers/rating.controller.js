const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

exports.submitRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rideId, score, feedback } = req.body;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.passengerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this ride' });
    }
    if (ride.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Can only rate completed rides' });
    }
    if (!ride.driverId) {
      return res.status(400).json({ success: false, message: 'No driver to rate' });
    }

    const existingRating = await prisma.rating.findUnique({ where: { rideId } });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'Ride already rated' });
    }

    const rating = await prisma.rating.create({
      data: {
        rideId,
        giverId: req.user.id,
        driverId: ride.driverId,
        score,
        feedback: feedback || null,
      },
    });

    // Update driver average rating
    const allRatings = await prisma.rating.findMany({
      where: { driverId: ride.driverId },
    });
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await prisma.driver.update({
      where: { id: ride.driverId },
      data: { averageRating: Math.round(avg * 10) / 10 },
    });

    res.status(201).json({ success: true, rating });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDriverRatings = async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { driverId: req.params.driverId },
      include: { giver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
