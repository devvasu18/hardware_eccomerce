const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder, getMyOrders, cancelMyOrder, cancelOrderItem } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Create order - supports both authenticated and guest users
// Optional authentication: if token exists, it will be used; otherwise guest checkout
router.post('/create', async (req, res, next) => {
    // Try to authenticate if token exists, but don't fail if it doesn't
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const User = require('../models/User');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token invalid or expired, continue as guest
            console.log('Auth token invalid, processing as guest order');
        }
    }
    next();
}, createOrder);

router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, getOrderById);
// Only needed single upload if we assume one image for bus/proof. 
// "busPhoto" is the field name we expect in frontend
router.put('/:id/status', protect, admin, upload.single('busPhoto'), updateOrderStatus);
router.post('/:id/cancel', protect, admin, cancelOrder);
router.post('/:id/cancel-my-order', protect, cancelMyOrder);
router.post('/:id/cancel-item/:itemId', protect, cancelOrderItem);

module.exports = router;
