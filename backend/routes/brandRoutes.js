const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');

// @desc    Get All Brands (Public)
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find({}).sort({ name: 1 });
        // Map to standard response format if needed (logo vs logo_image)
        const formatted = brands.map(b => ({
            _id: b._id,
            name: b.name,
            logo: b.logo_image,
            slug: b.slug
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json([]);
    }
});

// @desc   Get Featured Brands for Home
router.get('/featured', async (req, res) => {
    try {
        const brands = await Brand.find({}).limit(12); // Fetch enough for slider
        const formatted = brands.map(b => ({
            _id: b._id,
            name: b.name,
            logo: b.logo_image,
            slug: b.slug
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json([]);
    }
});

module.exports = router;
