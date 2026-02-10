const express = require('express');
const router = express.Router();
const {
    getEmailHealth,
    getFailedEmails,
    retryEmail,
    retryAllFailedEmails,
    deleteEmail
} = require('../controllers/emailHealthController');
const { protect, admin } = require('../middleware/authMiddleware');

// ===== Email Health & Monitoring =====
router.get('/health', protect, admin, getEmailHealth);

// ===== Failed Email Management =====
router.get('/failed', protect, admin, getFailedEmails);
router.post('/failed/:id/retry', protect, admin, retryEmail);
router.post('/failed/retry-all', protect, admin, retryAllFailedEmails);
router.delete('/failed/:id', protect, admin, deleteEmail);

module.exports = router;
