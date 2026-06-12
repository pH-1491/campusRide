const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

exports.requestRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { pickupLocation, pickupLat, pickupLng, dropLocation, dropLat, dropLng, scheduledFor } = req.body;

    // Check if passenger already has an active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        passengerId: req.user.id,
        status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    });

    if (activeRide) {
      return res.status(400).json({ success: false, message: 'You already have an active ride request' });
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickupLocation,
        pickupLat: pickupLat || null,
        pickupLng: pickupLng || null,
        dropLocation,
        dropLat: dropLat || null,
        dropLng: dropLng || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
      include: {
        passenger: { select: { name: true, phone: true } },
      },
    });

    // Broadcast new ride request to all online drivers
    req.io.emit('ride:new_request', {
      rideId: ride.id,
      passenger: ride.passenger,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      requestedAt: ride.requestedAt,
    });

    res.status(201).json({ success: true, ride });
  } catch (error) {
    console.error('Request ride error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    if (!driver.isOnline) return res.status(400).json({ success: false, message: 'You must be online to accept rides' });

    // Check driver doesn't have active ride
    const driverActiveRide = await prisma.ride.findFirst({
      where: { driverId: driver.id, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
    });
    if (driverActiveRide) {
      return res.status(400).json({ success: false, message: 'Complete your current ride first' });
    }

    // Atomic update: only accept if still REQUESTED
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'REQUESTED') {
      return res.status(400).json({ success: false, message: 'Ride is no longer available' });
    }

    const updatedRide = await prisma.ride.update({
      where: { id, status: 'REQUESTED' }, // optimistic lock
      data: {
        driverId: driver.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        passenger: { select: { name: true, phone: true } },
        driver: {
          include: { user: { select: { name: true, phone: true } } },
        },
      },
    });

    // Notify the passenger
    req.io.emit(`ride:${id}:accepted`, {
      rideId: id,
      driver: {
        id: driver.id,
        name: updatedRide.driver.user.name,
        phone: updatedRide.driver.user.phone,
        vehicleNumber: updatedRide.driver.vehicleNumber,
        vehicleType: updatedRide.driver.vehicleType,
        averageRating: updatedRide.driver.averageRating,
        currentLat: updatedRide.driver.currentLat,
        currentLng: updatedRide.driver.currentLng,
      },
    });

    // Notify all drivers that this ride is taken
    req.io.emit('ride:taken', { rideId: id });

    res.json({ success: true, ride: updatedRide });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Ride was already accepted by another driver' });
    }
    console.error('Accept ride error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectRide = async (req, res) => {
  try {
    const { id } = req.params;
    // Driver rejecting doesn't change ride status — it stays REQUESTED for other drivers
    // Just emit to notify passenger of rejection attempt (not commonly needed)
    res.json({ success: true, message: 'Ride rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.startRide = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });

    const ride = await prisma.ride.update({
      where: { id, driverId: driver.id, status: 'ACCEPTED' },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: { passenger: { select: { name: true } } },
    });

    req.io.emit(`ride:${id}:started`, { rideId: id, startedAt: ride.startedAt });

    res.json({ success: true, ride });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Cannot start ride — invalid state' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { fare, distance } = req.body;
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });

    const ride = await prisma.ride.update({
      where: { id, driverId: driver.id, status: 'IN_PROGRESS' },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        fare: fare || null,
        distance: distance || null,
      },
    });

    // Update driver total rides
    await prisma.driver.update({
      where: { id: driver.id },
      data: { totalRides: { increment: 1 } },
    });

    req.io.emit(`ride:${id}:completed`, { rideId: id, completedAt: ride.completedAt, fare: ride.fare });

    res.json({ success: true, ride });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Cannot complete ride — invalid state' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    // Passengers can cancel REQUESTED or ACCEPTED rides; drivers ACCEPTED
    const isOwner = ride.passengerId === req.user.id;
    const isDriver = req.user.role === 'DRIVER';

    if (!isOwner && !isDriver) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel ride in current state' });
    }

    const updated = await prisma.ride.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason || null },
    });

    req.io.emit(`ride:${id}:cancelled`, { rideId: id, reason });
    req.io.emit('ride:cancelled', { rideId: id });

    res.json({ success: true, ride: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: {
        passenger: { select: { name: true, phone: true } },
        driver: {
          include: { user: { select: { name: true, phone: true } } },
        },
        rating: true,
      },
    });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { passengerId: req.user.id };
    if (status) where.status = status;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          driver: { include: { user: { select: { name: true, phone: true } } } },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({ success: true, rides, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          passenger: { select: { name: true, email: true } },
          driver: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({ success: true, rides, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
