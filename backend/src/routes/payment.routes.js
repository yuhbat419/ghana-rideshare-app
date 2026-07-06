const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { initializeTransaction, verifyTransaction } = require('../services/paystack.service');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);

router.post('/initialize', async (req, res, next) => {
  try {
    const { jobId } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404, null, 'JOB_NOT_FOUND');
    }

   if (job.customerId !== req.user.id) {
  return errorResponse(res, 'You can only pay for your own trips', 403, null, 'FORBIDDEN');
}

    const reference = `RIDE-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const amount = job.finalPrice || job.estimatedPrice;

    const paystackResponse = await initializeTransaction({
      email: req.user.email || `${req.user.phone}@ghanarideshare.com`,
      amount: parseFloat(amount),
      reference,
      metadata: {
        jobId: job.id,
        customerId: req.user.id,
      },
    });

    const existingTransaction = await prisma.transaction.findUnique({
      where: { jobId: job.id },
    });

    if (existingTransaction) {
      await prisma.transaction.update({
        where: { jobId: job.id },
        data: {
          paystackRef: reference,
          amount,
          method: 'MOBILE_MONEY',
          status: 'PENDING',
        },
      });
    } else {
      await prisma.transaction.create({
        data: {
          jobId: job.id,
          customerId: req.user.id,
          amount,
          method: 'MOBILE_MONEY',
          status: 'PENDING',
          paystackRef: reference,
          platformFee: (parseFloat(amount) * 0.15).toFixed(2),
          driverPayout: (parseFloat(amount) * 0.85).toFixed(2),
        },
      });
    }

    return successResponse(res, 'Payment initialized', {
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify/:reference', async (req, res, next) => {
  try {
    const { reference } = req.params;

    const verification = await verifyTransaction(reference);

    if (verification.data.status === 'success') {
      const transaction = await prisma.transaction.update({
        where: { paystackRef: reference },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      return successResponse(res, 'Payment verified successfully', {
        status: 'success',
        transaction,
      });
    } else {
      await prisma.transaction.update({
        where: { paystackRef: reference },
        data: { status: 'FAILED' },
      });

      return successResponse(res, 'Payment was not successful', {
        status: 'failed',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;