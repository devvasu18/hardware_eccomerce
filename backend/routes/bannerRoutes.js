const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner, removeProductFromBanner } = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Valid routes
router.get('/', getBanners); // Public read
router.post('/', protect, admin, upload.single('image'), createBanner);
router.put('/:id', protect, admin, upload.single('image'), updateBanner);
router.delete('/:id', protect, admin, deleteBanner);
router.delete('/:id/products/:productId', protect, admin, removeProductFromBanner);

module.exports = router;
