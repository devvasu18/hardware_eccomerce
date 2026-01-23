const express = require('express');
const router = express.Router();
const { getParties, createParty, updateParty, deleteParty } = require('../controllers/partyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getParties);
router.post('/', protect, admin, createParty);
router.put('/:id', protect, admin, updateParty);
router.delete('/:id', protect, admin, deleteParty);

module.exports = router;
