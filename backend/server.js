require('dotenv/config');
const app = require('./src/app');
const logger = require('./src/utils/logger');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Start server first — don't wait for database
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  // Then try to connect to database
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed — retrying in 5 seconds...');
    setTimeout(async () => {
      try {
        await prisma.$connect();
        logger.info('Database connected successfully on retry');
      } catch (retryError) {
        logger.error('Database retry failed:', retryError.message);
      }
    }, 5000);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Server shut down gracefully');
  process.exit(0);
});