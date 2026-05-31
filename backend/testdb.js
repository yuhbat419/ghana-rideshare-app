
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('CONNECTED SUCCESSFULLY');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.log('FAILED:', e.message);
    return prisma.$disconnect();
  });