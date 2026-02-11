const express = require('express');
const router = express.Router();
const homeLayoutController = require('../controllers/homeLayoutController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/', homeLayoutController.getAllLayoutComponents);
router.post('/', homeLayoutController.addComponent);
router.put('/reorder', homeLayoutController.reorderComponents);
router.put('/:id', homeLayoutController.updateComponent);
router.delete('/:id', homeLayoutController.deleteComponent);

module.exports = router;
