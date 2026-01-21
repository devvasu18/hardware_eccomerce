const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all active banners (Public)
// @route   GET /api/banners
// @access  Public
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { title, subtitle, image, position, order } = req.body;
        const banner = await Banner.create({
            title,
            subtitle,
            image,
            position,
            order
        });
        res.status(201).json(banner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            banner.title = req.body.title || banner.title;
            banner.subtitle = req.body.subtitle || banner.subtitle;
            banner.image = req.body.image || banner.image;
            banner.position = req.body.position || banner.position;
            banner.order = req.body.order !== undefined ? req.body.order : banner.order;
            banner.isActive = req.body.isActive !== undefined ? req.body.isActive : banner.isActive;

            const updatedBanner = await banner.save();
            res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            await banner.deleteOne();
            res.json({ message: 'Banner removed' });
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
