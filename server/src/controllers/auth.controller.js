const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role = 'PASSENGER', vehicleNumber, licenseNumber, vehicleType } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, role },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    // Auto-create driver profile if registering as driver
    if (role === 'DRIVER' && vehicleNumber && licenseNumber) {
      await prisma.driver.create({
        data: {
          userId: user.id,
          vehicleNumber,
          licenseNumber,
          vehicleType: vehicleType || 'E-Rickshaw',
        },
      });
    }

    const token = generateToken(user.id);

    // Fetch complete user with driver profile if applicable
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true,
        driverProfile: role === 'DRIVER' ? {
          select: { id: true, vehicleNumber: true, vehicleType: true, isVerified: true, isOnline: true }
        } : false,
      },
    });

    res.status(201).json({ success: true, token, user: fullUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        driverProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { driverProfile: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  // If driver, set them offline
  if (req.user.role === 'DRIVER') {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
    if (driver) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { isOnline: false },
      });
      // Emit driver offline
      req.io.emit('driver:offline', { driverId: driver.id });
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
};
