const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, upload.single('image'), createCoupon);
router.put('/:id', protect, admin, upload.single('image'), updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
