const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Track connected sockets by userId
const connectedUsers = new Map(); // userId -> socketId

exports.initializeSocket = (io) => {
  // Middleware: authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true },
      });

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`🔌 Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    // Track user
    connectedUsers.set(user.id, socket.id);

    // Join role-based room
    socket.join(`role:${user.role}`);
    socket.join(`user:${user.id}`);

    // Send current online drivers on connect
    if (user.role === 'PASSENGER' || user.role === 'ADMIN') {
      prisma.driver.findMany({
        where: { isOnline: true, isVerified: true },
        include: { user: { select: { name: true } } },
      }).then(drivers => {
        socket.emit('drivers:current', drivers.map(d => ({
          driverId: d.id,
          name: d.user.name,
          vehicleNumber: d.vehicleNumber,
          vehicleType: d.vehicleType,
          currentLat: d.currentLat,
          currentLng: d.currentLng,
          averageRating: d.averageRating,
        })));
      });
    }

    // Driver goes online/offline (via socket, alternative to REST)
    socket.on('driver:set_online', async (data) => {
      if (user.role !== 'DRIVER') return;
      try {
        const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
        if (!driver || !driver.isVerified) return;

        const updated = await prisma.driver.update({
          where: { id: driver.id },
          data: { isOnline: data.online },
        });

        io.emit(data.online ? 'driver:online' : 'driver:offline', {
          driverId: driver.id,
          name: user.name,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
          averageRating: driver.averageRating,
        });

        socket.emit('driver:status_updated', { isOnline: data.online });
      } catch (err) {
        console.error('Socket driver online error:', err);
      }
    });

    // Driver location update
    socket.on('driver:update_location', async ({ lat, lng }) => {
      if (user.role !== 'DRIVER') return;
      try {
        const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
        if (!driver) return;

        await prisma.driver.update({
          where: { id: driver.id },
          data: { currentLat: lat, currentLng: lng },
        });

        io.emit('driver:location', { driverId: driver.id, lat, lng });
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // Passenger cancels a ride via socket
    socket.on('ride:cancel', async ({ rideId, reason }) => {
      try {
        const ride = await prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride || ride.passengerId !== user.id) return;
        if (!['REQUESTED', 'ACCEPTED'].includes(ride.status)) return;

        await prisma.ride.update({
          where: { id: rideId },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
        });

        io.emit(`ride:${rideId}:cancelled`, { rideId, reason });
        io.emit('ride:cancelled', { rideId });
      } catch (err) {
        console.error('Socket cancel error:', err);
      }
    });

    // Typing/ping for passenger tracking
    socket.on('passenger:location', ({ rideId, lat, lng }) => {
      io.emit(`ride:${rideId}:passenger_location`, { lat, lng });
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${user.name} [${socket.id}]`);
      connectedUsers.delete(user.id);

      // Auto offline on disconnect for drivers
      if (user.role === 'DRIVER') {
        try {
          const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
          if (driver && driver.isOnline) {
            await prisma.driver.update({ where: { id: driver.id }, data: { isOnline: false } });
            io.emit('driver:offline', { driverId: driver.id });
          }
        } catch (err) {
          console.error('Disconnect cleanup error:', err);
        }
      }
    });
  });

  console.log('✅ Socket.IO handlers initialized');
};

exports.connectedUsers = connectedUsers;
