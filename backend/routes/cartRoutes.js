const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id }).populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive'
        });

        if (!cart) {
            return res.json({ items: [], total: 0, itemCount: 0 });
        }

        // Filter out items where product was deleted (null)
        const validItems = cart.items.filter(item => item.product);

        // Calculate totals based on valid items
        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            items: validItems,
            total,
            itemCount,
            lastModified: cart.lastModified
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
    }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity, price, size } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate stock (if not on-demand)
        // STRICT CHECK REMOVED to allow Backorders/Hybrid Shift
        // if (!product.isOnDemand && product.stock < quantity) { ... }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            // Create new cart
            cart = new Cart({
                user: req.user.id,
                items: [{
                    product: productId,
                    quantity,
                    price,
                    size
                }]
            });
        } else {
            // Check if item already exists (match by product AND size)
            const existingItemIndex = cart.items.findIndex(item =>
                item.product.toString() === productId &&
                (size ? item.size === size : !item.size)
            );

            if (existingItemIndex > -1) {
                // Update quantity
                cart.items[existingItemIndex].quantity += quantity;
                cart.items[existingItemIndex].price = price; // Update price in case it changed
            } else {
                // Add new item
                cart.items.push({
                    product: productId,
                    quantity,
                    price,
                    size
                });
            }
        }

        console.log('Saving cart...');
        await cart.save();
        console.log('Cart saved. Populating...');
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive'
        });
        console.log('Cart populated.');

        const validItems = cart.items.filter(item => item.product); // Filter nulls
        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            message: 'Item added to cart',
            items: validItems,
            total,
            itemCount
        });
    } catch (err) {
        console.error('Add to cart error:', err);
        // Stack trace might help identify source of "next" call
        console.error(err.stack);
        res.status(500).json({ message: 'Failed to add item to cart', error: err.message });
    }
});

// Update cart item quantity
router.patch('/update', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            (size ? item.size === size : !item.size)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Validate stock
        // STRICT CHECK REMOVED to allow Backorders
        // const product = await Product.findById(productId);
        // if (product && !product.isOnDemand && product.stock < quantity) { ... }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive'
        });

        const validItems = cart.items.filter(item => item.product);
        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            message: 'Cart updated',
            items: validItems,
            total,
            itemCount
        });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ message: 'Failed to update cart', error: err.message });
    }
});

// Remove item from cart
router.delete('/remove', authenticateToken, async (req, res) => {
    try {
        const { productId, size } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item =>
            !(item.product.toString() === productId &&
                (size ? item.size === size : !item.size))
        );

        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive'
        });

        const validItems = cart.items.filter(item => item.product);
        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            message: 'Item removed from cart',
            items: validItems,
            total,
            itemCount
        });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ message: 'Failed to remove item', error: err.message });
    }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user.id });
        res.json({ message: 'Cart cleared', items: [], total: 0, itemCount: 0 });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ message: 'Failed to clear cart', error: err.message });
    }
});

// Sync localStorage cart with database (on login)
router.post('/sync', authenticateToken, async (req, res) => {
    try {
        const { localCartItems } = req.body;

        if (!localCartItems || !Array.isArray(localCartItems) || localCartItems.length === 0) {
            return res.json({ message: 'No items to sync' });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            // Create new cart with local items
            cart = new Cart({
                user: req.user.id,
                items: localCartItems.map(item => ({
                    product: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size
                }))
            });
        } else {
            // Merge local items with existing cart
            for (const localItem of localCartItems) {
                const existingItemIndex = cart.items.findIndex(item =>
                    item.product.toString() === localItem.productId &&
                    (localItem.size ? item.size === localItem.size : !item.size)
                );

                if (existingItemIndex > -1) {
                    // Add quantities together
                    cart.items[existingItemIndex].quantity += localItem.quantity;
                    cart.items[existingItemIndex].price = localItem.price; // Use latest price
                } else {
                    // Add new item
                    cart.items.push({
                        product: localItem.productId,
                        quantity: localItem.quantity,
                        price: localItem.price,
                        size: localItem.size
                    });
                }
            }
        }

        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive'
        });

        const validItems = cart.items.filter(item => item.product);
        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            message: 'Cart synced successfully',
            items: validItems,
            total,
            itemCount
        });
    } catch (err) {
        console.error('Sync cart error:', err);
        res.status(500).json({ message: 'Failed to sync cart', error: err.message });
    }
});

module.exports = router;
