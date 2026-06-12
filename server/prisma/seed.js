const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iitr.ac.in' },
    update: {},
    create: {
      name: 'Admin IITR',
      email: 'admin@iitr.ac.in',
      password: adminPassword,
      phone: '9999999999',
      role: 'ADMIN',
    },
  });

  // Create sample passengers
  const passengerPassword = await bcrypt.hash('pass123', 10);
  const passenger1 = await prisma.user.upsert({
    where: { email: 'student1@iitr.ac.in' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'student1@iitr.ac.in',
      password: passengerPassword,
      phone: '9876543210',
      role: 'PASSENGER',
    },
  });

  const passenger2 = await prisma.user.upsert({
    where: { email: 'student2@iitr.ac.in' },
    update: {},
    create: {
      name: 'Priya Singh',
      email: 'student2@iitr.ac.in',
      password: passengerPassword,
      phone: '9876543211',
      role: 'PASSENGER',
    },
  });

  // Create sample drivers
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver1User = await prisma.user.upsert({
    where: { email: 'driver1@iitr.ac.in' },
    update: {},
    create: {
      name: 'Ramesh Kumar',
      email: 'driver1@iitr.ac.in',
      password: driverPassword,
      phone: '9876543212',
      role: 'DRIVER',
    },
  });

  await prisma.driver.upsert({
    where: { userId: driver1User.id },
    update: {},
    create: {
      userId: driver1User.id,
      vehicleNumber: 'UK07-ER-0001',
      vehicleType: 'E-Rickshaw',
      licenseNumber: 'UK0720230001',
      isVerified: true,
      isOnline: false,
      currentLat: 29.8638,
      currentLng: 77.8990,
      totalRides: 45,
      averageRating: 4.6,
    },
  });

  const driver2User = await prisma.user.upsert({
    where: { email: 'driver2@iitr.ac.in' },
    update: {},
    create: {
      name: 'Suresh Yadav',
      email: 'driver2@iitr.ac.in',
      password: driverPassword,
      phone: '9876543213',
      role: 'DRIVER',
    },
  });

  await prisma.driver.upsert({
    where: { userId: driver2User.id },
    update: {},
    create: {
      userId: driver2User.id,
      vehicleNumber: 'UK07-ER-0002',
      vehicleType: 'E-Rickshaw',
      licenseNumber: 'UK0720230002',
      isVerified: true,
      isOnline: false,
      currentLat: 29.8650,
      currentLng: 77.9010,
      totalRides: 32,
      averageRating: 4.3,
    },
  });

  console.log(' Seeding complete!');
  console.log('\nDemo Credentials:');
  console.log('  Admin:     admin@iitr.ac.in / admin123');
  console.log('  Passenger: student1@iitr.ac.in / pass123');
  console.log('  Driver:    driver1@iitr.ac.in / driver123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
