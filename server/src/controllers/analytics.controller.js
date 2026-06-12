const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getOverview = async (req, res) => {
  try {
    const [totalRides, completedRides, activeRides, totalUsers, totalDrivers, onlineDrivers, cancelledRides] =
      await Promise.all([
        prisma.ride.count(),
        prisma.ride.count({ where: { status: 'COMPLETED' } }),
        prisma.ride.count({ where: { status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] } } }),
        prisma.user.count({ where: { role: 'PASSENGER' } }),
        prisma.driver.count(),
        prisma.driver.count({ where: { isOnline: true } }),
        prisma.ride.count({ where: { status: 'CANCELLED' } }),
      ]);

    res.json({
      success: true,
      overview: {
        totalRides,
        completedRides,
        activeRides,
        cancelledRides,
        totalUsers,
        totalDrivers,
        onlineDrivers,
        completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRidesTrend = async (req, res) => {
  try {
    // Last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.ride.count({
        where: { createdAt: { gte: date, lt: nextDate } },
      });

      days.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        rides: count,
      });
    }

    res.json({ success: true, trend: days });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPeakHours = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      select: { requestedAt: true },
    });

    const hourCounts = Array(24).fill(0);
    rides.forEach(ride => {
      const hour = new Date(ride.requestedAt).getHours();
      hourCounts[hour]++;
    });

    const peakHours = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      rides: count,
    }));

    res.json({ success: true, peakHours });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPopularLocations = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      select: { pickupLocation: true, dropLocation: true },
    });

    const locationCount = {};
    rides.forEach(ride => {
      locationCount[ride.pickupLocation] = (locationCount[ride.pickupLocation] || 0) + 1;
      locationCount[ride.dropLocation] = (locationCount[ride.dropLocation] || 0) + 1;
    });

    const locations = Object.entries(locationCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { rides: true } },
      },
      orderBy: { totalRides: 'desc' },
      take: 10,
    });

    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
