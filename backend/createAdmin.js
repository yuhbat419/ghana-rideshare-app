require('dotenv/config');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/database');

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('Admin123456', 12);

    const admin = await prisma.user.upsert({
      where: { phone: '0200000000' },
      update: { password: hashedPassword },
      create: {
        phone: '0200000000',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
      },
    });

    console.log('Admin created successfully:', admin.phone);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed:', error.message);
    await prisma.$disconnect();
  }
};

createAdmin();