const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all active categories (for homepage)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ displayOrder: 1 })
            .select('-__v')
            .lean(); // Use lean for better performance

        // Calculate product count dynamically
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Product.countDocuments({
                    category: category._id, // Use ObjectId instead of slug
                    isVisible: true
                });
                return {
                    ...category,
                    productCount: count
                };
            })
        );

        res.json(categoriesWithCount);
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

// Get subcategories by category slug
router.get('/:slug/subcategories', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const SubCategory = require('../models/SubCategory');
        const subcategories = await SubCategory.find({ category_id: category._id });
        res.json(subcategories);
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
        if (req.body.showInNav === true) {
            const count = await Category.countDocuments({ showInNav: true, _id: { $ne: req.params.id } });
            if (count >= 10) {
                return res.status(400).json({ message: 'Navigation limit reached (max 10). Uncheck "Show in Navigation".' });
            }
        }

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
