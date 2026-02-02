const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');

// We might want to add auth middleware here later, 
// but for now, we keep it open or rely on frontend sending valid data.
// Ideally: router.post('/create-order', protect, createPaymentOrder);

// Helper to extract user if present, but allow guests
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/create-order', optionalProtect, createPaymentOrder);
router.post('/verify', verifyPayment);

module.exports = router;
