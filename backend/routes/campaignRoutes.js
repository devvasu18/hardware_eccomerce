const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, campaignController.createCampaign);
router.get('/', protect, admin, campaignController.getCampaigns);
router.get('/:id', protect, admin, campaignController.getCampaignStrats);
router.post('/:id/send', protect, admin, campaignController.sendCampaign);
router.post('/track', campaignController.trackInteraction); // public or protect depending

module.exports = router;
