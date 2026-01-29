const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');

// We might want to add auth middleware here later, 
// but for now, we keep it open or rely on frontend sending valid data.
// Ideally: router.post('/create-order', protect, createPaymentOrder);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

module.exports = router;
