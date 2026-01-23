const express = require('express');
const router = express.Router();
const { getRefunds, requestRefund, updateRefundStatus } = require('../controllers/refundController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getRefunds);
router.post('/request', protect, requestRefund);
router.put('/:id/status', protect, admin, updateRefundStatus);

module.exports = router;
