const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all active categories (for homepage)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ displayOrder: 1 })
            .select('-__v');

        // Optionally calculate product count dynamically
        for (let category of categories) {
            const count = await Product.countDocuments({
                category: category.slug,
                isVisible: true
            });
            category.productCount = count;
        }

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single category
router.get('/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug, isActive: true });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create category
router.post('/', async (req, res) => {
    try {
        const category = new Category(req.body);
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update category
router.put('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
