const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// Get user's wishlist
router.get('/', protect, async (req, res) => {
    try {
        // Check if user exists (protect middleware might set req.user to null)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not found. Please login again.' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'title basePrice discountedPrice featured_image gallery_images stock category isActive offers'
            });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, items: [] });
        }

        // Filter out deleted/inactive products
        const validItems = wishlist.items.filter(item =>
            item.product && item.product.isActive !== false
        );

        res.json({
            items: validItems,
            count: validItems.length
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
});

// Add item to wishlist
router.post('/add', protect, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        // Check if product already in wishlist
        const existingItem = wishlist.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add product to wishlist
        wishlist.items.push({ product: productId });
        await wishlist.save();

        // Populate and return updated wishlist
        await wishlist.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock category isActive offers'
        });

        const validItems = wishlist.items.filter(item =>
            item.product && item.product.isActive !== false
        );

        res.json({
            message: 'Product added to wishlist',
            items: validItems,
            count: validItems.length
        });
    } catch (error) {
        console.error('❌ ERROR in add to wishlist:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Failed to add to wishlist',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Remove item from wishlist
router.delete('/remove/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        // Remove product from wishlist
        wishlist.items = wishlist.items.filter(
            item => item.product.toString() !== productId
        );

        await wishlist.save();

        // Populate and return updated wishlist
        await wishlist.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock category isActive offers'
        });

        const validItems = wishlist.items.filter(item =>
            item.product && item.product.isActive !== false
        );

        res.json({
            message: 'Product removed from wishlist',
            items: validItems,
            count: validItems.length
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Failed to remove from wishlist' });
    }
});

// Clear entire wishlist
router.delete('/clear', protect, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.items = [];
        await wishlist.save();

        res.json({
            message: 'Wishlist cleared',
            items: [],
            count: 0
        });
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        res.status(500).json({ message: 'Failed to clear wishlist' });
    }
});

// Sync guest wishlist to database (on login)
router.post('/sync', protect, async (req, res) => {
    try {
        const { localWishlistItems } = req.body;

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        // Add local items to database wishlist (avoid duplicates)
        if (localWishlistItems && Array.isArray(localWishlistItems)) {
            for (const productId of localWishlistItems) {
                const exists = wishlist.items.find(
                    item => item.product.toString() === productId
                );
                if (!exists) {
                    // Verify product exists
                    const product = await Product.findById(productId);
                    if (product) {
                        wishlist.items.push({ product: productId });
                    }
                }
            }
        }

        await wishlist.save();

        // Populate and return synced wishlist
        await wishlist.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock category isActive offers'
        });

        const validItems = wishlist.items.filter(item =>
            item.product && item.product.isActive !== false
        );

        res.json({
            message: 'Wishlist synced successfully',
            items: validItems,
            count: validItems.length
        });
    } catch (error) {
        console.error('Error syncing wishlist:', error);
        res.status(500).json({ message: 'Failed to sync wishlist' });
    }
});

module.exports = router;
