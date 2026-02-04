const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getRevenueAnalytics, getTopProducts, getInventoryHealth, getRecentActivity } = require('../controllers/analyticsController');

router.get('/revenue', protect, admin, getRevenueAnalytics);
router.get('/top-products', protect, admin, getTopProducts);
router.get('/inventory', protect, admin, getInventoryHealth);
router.get('/activity', protect, admin, getRecentActivity);

module.exports = router;
