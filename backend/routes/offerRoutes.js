const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');

// @desc    Get public offers (for frontend display)
// @route   GET /api/offers
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { slug } = req.query;
        const query = { isActive: true }; // Only return active offers for public

        // Filter by slug if provided
        if (slug) {
            query.slug = slug;
        }

        const offers = await Offer.find(query).sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Get single offer by slug
// @route   GET /api/offers/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        const offer = await Offer.findOne({
            slug: req.params.slug,
            isActive: true
        });

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
