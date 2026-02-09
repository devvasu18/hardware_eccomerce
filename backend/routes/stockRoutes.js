const express = require('express');
const router = express.Router();
const { createStockEntry, getStockEntries, getProductLedger } = require('../controllers/stockController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createStockEntry);
router.get('/', protect, admin, getStockEntries);
router.get('/ledger', protect, admin, getProductLedger);
router.post('/:id/sync', protect, admin, require('../controllers/stockController').syncStockEntry);

module.exports = router;
