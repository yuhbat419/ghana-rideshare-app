const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv/config');

const { errorResponse } = require('./utils/apiResponse');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ghana Rideshare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// More routes will be added here as we build:
const driverRoutes = require('./routes/driver.routes');
app.use('/api/v1/drivers', driverRoutes);// app.use('/api/v1/customers', customerRoutes);
const jobRoutes = require('./routes/job.routes');
app.use('/api/v1/jobs', jobRoutes);
const adminRoutes = require('./routes/admin.routes');
app.use('/api/v1/admin', adminRoutes);
// app.use('/api/v1/payments', paymentRoutes);

// Handle unknown routes
app.use('*splat', (req, res) => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404, null, 'ROUTE_NOT_FOUND');
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    err.status || 500,
    null,
    'SERVER_ERROR'
  );
});

module.exports = app;