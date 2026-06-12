const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { rides: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyDriver = async (req, res) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isVerified: true },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.unverifyDriver = async (req, res) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isVerified: false, isOnline: false },
    });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

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

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
