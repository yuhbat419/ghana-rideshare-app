const axios = require('axios');
const logger = require('../utils/logger');

const paystackAPI = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Initialize a payment transaction
const initializeTransaction = async ({ email, amount, reference, metadata }) => {
  try {
    const response = await paystackAPI.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // Paystack uses kobo/pesewas
      reference,
      currency: 'GHS',
      metadata,
      channels: ['mobile_money', 'card'],
    });
    return response.data;
  } catch (error) {
    logger.error(`Paystack init error: ${error.response?.data?.message || error.message}`);
    throw new Error(error.response?.data?.message || 'Payment initialization failed');
  }
};

// Verify a payment transaction
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    logger.error(`Paystack verify error: ${error.response?.data?.message || error.message}`);
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
};

module.exports = { initializeTransaction, verifyTransaction };