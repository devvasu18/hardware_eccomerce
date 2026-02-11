const express = require('express');
const router = express.Router();
const homeLayoutController = require('../controllers/homeLayoutController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public layout route
router.get('/', homeLayoutController.getActiveLayout);

// Admin layout routes
router.get('/admin', protect, admin, homeLayoutController.getAllLayoutComponents);
router.post('/admin', protect, admin, homeLayoutController.addComponent);
router.put('/admin/reorder', protect, admin, homeLayoutController.reorderComponents);
router.put('/admin/:id', protect, admin, homeLayoutController.updateComponent);
router.delete('/admin/:id', protect, admin, homeLayoutController.deleteComponent);

module.exports = router;
