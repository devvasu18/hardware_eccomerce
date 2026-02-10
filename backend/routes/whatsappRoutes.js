const express = require('express');
const router = express.Router();
const { getSessionStatus, sendMessage, getQueueStatus, restartSession } = require('../controllers/whatsappController');
const {
    getSystemHealth,
    getFailedMessages,
    retryMessage,
    retryAllFailed,
    deleteMessage,
    getQueueStats
} = require('../controllers/whatsappHealthController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get Status of Session (e.g., 'default')
router.get('/status/:sessionId', protect, admin, getSessionStatus);

// Add Message to Queue
router.post('/send', protect, admin, sendMessage);

// View Queue Status
router.get('/queue', protect, admin, getQueueStatus);

// Restart Session (Fix Errors)
router.post('/restart/:sessionId', protect, admin, restartSession);

// ===== Health & Monitoring Routes =====
router.get('/health', protect, admin, getSystemHealth);
router.get('/stats', protect, admin, getQueueStats);

// ===== Failed Message Management =====
router.get('/failed', protect, admin, getFailedMessages);
router.post('/failed/:id/retry', protect, admin, retryMessage);
router.post('/failed/retry-all', protect, admin, retryAllFailed);
router.delete('/failed/:id', protect, admin, deleteMessage);

module.exports = router;
