const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle connection errors gracefully
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

module.exports = prisma;