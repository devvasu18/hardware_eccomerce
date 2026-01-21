const express = require('express');
const router = express.Router();
const SpecialOffer = require('../models/SpecialOffer');
const Product = require('../models/Product');

// Get all active special offers (for homepage)
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const offers = await SpecialOffer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
            .populate('productId', 'name category images imageUrl')
            .sort({ displayOrder: 1 })
            .select('-__v');

        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single offer
router.get('/:id', async (req, res) => {
    try {
        const offer = await SpecialOffer.findById(req.params.id)
            .populate('productId');
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get all offers (including expired)
router.get('/admin/all', async (req, res) => {
    try {
        const offers = await SpecialOffer.find()
            .populate('productId', 'name category')
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create special offer
router.post('/', async (req, res) => {
    try {
        // Validate product exists
        const product = await Product.findById(req.body.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const offer = new SpecialOffer(req.body);
        const newOffer = await offer.save();
        res.status(201).json(newOffer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update special offer
router.put('/:id', async (req, res) => {
    try {
        const offer = await SpecialOffer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete special offer
router.delete('/:id', async (req, res) => {
    try {
        const offer = await SpecialOffer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
