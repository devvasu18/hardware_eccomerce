const express = require('express');
const router = express.Router();
const { getRefunds, requestRefund, updateRefundStatus } = require('../controllers/refundController');
const { exportRefunds } = require('../controllers/exportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/export', protect, admin, exportRefunds);
router.get('/', protect, admin, getRefunds);
router.post('/request', protect, requestRefund);
router.put('/:id/status', protect, admin, updateRefundStatus);

module.exports = router;

