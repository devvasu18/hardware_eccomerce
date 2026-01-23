const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, admin, getOrders);
router.get('/:id', protect, admin, getOrderById);
// Only needed single upload if we assume one image for bus/proof. 
// "busPhoto" is the field name we expect in frontend
router.put('/:id/status', protect, admin, upload.single('busPhoto'), updateOrderStatus);
router.post('/:id/cancel', protect, admin, cancelOrder);

module.exports = router;
