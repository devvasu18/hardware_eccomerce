const express = require('express');
const router = express.Router();
const { getTransactions, handlePaymentWebhook, processRefund, createTransaction } = require('../controllers/transactionController');
const { exportTransactions } = require('../controllers/exportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/export', protect, admin, exportTransactions);
router.get('/', protect, admin, getTransactions);
router.post('/', protect, admin, createTransaction);
router.post('/webhook', handlePaymentWebhook); // Public Webhook
router.post('/refund', protect, admin, processRefund);

module.exports = router;

