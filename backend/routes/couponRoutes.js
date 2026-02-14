const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon, getCouponById } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, admin, getCoupons);
router.get('/:id', protect, admin, getCouponById);
router.post('/', protect, admin, upload.single('image'), createCoupon);
router.put('/:id', protect, admin, upload.single('image'), updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

// Custom route for validation
router.post('/validate', validateCoupon);

module.exports = router;
