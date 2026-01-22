const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const masterController = require('../controllers/masterController');

// Stats
router.get('/stats', protect, admin, masterController.getStats);

// HSN
router.get('/hsn', protect, admin, masterController.getHSNs);
router.post('/hsn', protect, admin, masterController.createHSN);
router.put('/hsn/:id', protect, admin, masterController.updateHSN);
router.delete('/hsn/:id', protect, admin, masterController.deleteHSN);

// Offers
router.get('/offers', protect, admin, masterController.getOffers);
router.post('/offers', protect, admin, upload.single('banner_image'), masterController.createOffer);
router.delete('/offers/:id', protect, admin, masterController.deleteOffer);

// Categories
router.get('/categories', protect, admin, masterController.getCategories);
router.post('/categories', protect, admin, upload.single('image'), masterController.createCategory);
router.delete('/categories/:id', protect, admin, masterController.deleteCategory);

// Sub-Categories
router.get('/sub-categories', protect, admin, masterController.getSubCategories);
router.post('/sub-categories', protect, admin, upload.single('image'), masterController.createSubCategory);
router.delete('/sub-categories/:id', protect, admin, masterController.deleteSubCategory);

// Brands
router.get('/brands', protect, admin, masterController.getBrands);
router.post('/brands', protect, admin, upload.single('logo_image'), masterController.createBrand);
router.delete('/brands/:id', protect, admin, masterController.deleteBrand);

module.exports = router;
