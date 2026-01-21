const express = require('express');
const router = express.Router();
const Feature = require('../models/Feature');
const TrustIndicator = require('../models/TrustIndicator');

// Get all active features (for homepage)
router.get('/features', async (req, res) => {
    try {
        const features = await Feature.find({ isActive: true })
            .sort({ displayOrder: 1 })
            .select('-__v');
        res.json(features);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all active trust indicators (for homepage)
router.get('/trust-indicators', async (req, res) => {
    try {
        const indicators = await TrustIndicator.find({ isActive: true })
            .sort({ displayOrder: 1 })
            .select('-__v');
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create feature
router.post('/features', async (req, res) => {
    try {
        const feature = new Feature(req.body);
        const newFeature = await feature.save();
        res.status(201).json(newFeature);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update feature
router.put('/features/:id', async (req, res) => {
    try {
        const feature = await Feature.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!feature) {
            return res.status(404).json({ message: 'Feature not found' });
        }
        res.json(feature);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete feature
router.delete('/features/:id', async (req, res) => {
    try {
        const feature = await Feature.findByIdAndDelete(req.params.id);
        if (!feature) {
            return res.status(404).json({ message: 'Feature not found' });
        }
        res.json({ message: 'Feature deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create trust indicator
router.post('/trust-indicators', async (req, res) => {
    try {
        const indicator = new TrustIndicator(req.body);
        const newIndicator = await indicator.save();
        res.status(201).json(newIndicator);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update trust indicator
router.put('/trust-indicators/:id', async (req, res) => {
    try {
        const indicator = await TrustIndicator.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!indicator) {
            return res.status(404).json({ message: 'Trust indicator not found' });
        }
        res.json(indicator);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete trust indicator
router.delete('/trust-indicators/:id', async (req, res) => {
    try {
        const indicator = await TrustIndicator.findByIdAndDelete(req.params.id);
        if (!indicator) {
            return res.status(404).json({ message: 'Trust indicator not found' });
        }
        res.json({ message: 'Trust indicator deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
