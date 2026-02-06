const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id }).populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive gst_rate'
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
        const { productId, quantity, price, size, variationId, variationText, modelId, modelName } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // --- SECURE STOCK CALCULATION ---
        let limit = product.stock;

        if (modelId && product.models) {
            const model = product.models.find(m => m._id.toString() === modelId);
            if (model) {
                if (variationId) {
                    const variant = model.variations.find(v => v._id.toString() === variationId);
                    if (variant) limit = variant.stock;
                } else {
                    // Total model stock
                    limit = model.variations.reduce((acc, v) => acc + (v.stock || 0), 0);
                }
            }
        } else if (variationId && product.variations) {
            const variant = product.variations.find(v => v._id.toString() === variationId);
            if (variant) limit = variant.stock;
        }

        if (!product.isOnDemand && limit < quantity) {
            return res.status(400).json({ message: `Insufficient stock. Only ${limit} left.` });
        }

        // Fetch User to check for Wholesale Discount
        const user = await User.findById(req.user.id);

        let cart = await Cart.findOne({ user: req.user.id });

        // Calculate Price Securely
        let securePrice = product.selling_price_a || product.mrp;

        if (modelId && product.models) {
            const model = product.models.find(m => m._id.toString() === modelId);
            if (model) {
                securePrice = model.selling_price_a || model.mrp || securePrice;
                if (variationId) {
                    const variant = model.variations.find(v => v._id.toString() === variationId);
                    if (variant) securePrice = variant.price;
                }
            }
        } else if (variationId && product.variations) {
            const variant = product.variations.find(v => v._id.toString() === variationId);
            if (variant) securePrice = variant.price;
        }

        // Apply Wholesale Discount
        if (user && user.customerType === 'wholesale' && user.wholesaleDiscount > 0) {
            const discountAmount = (securePrice * user.wholesaleDiscount) / 100;
            securePrice = Math.round((securePrice - discountAmount) * 100) / 100;
        }

        if (!cart) {
            // Create new cart
            cart = new Cart({
                user: req.user.id,
                items: [{
                    product: productId,
                    quantity,
                    price: securePrice,
                    size,
                    variationId,
                    variationText,
                    modelId,
                    modelName
                }]
            });
        } else {
            // Check if item already exists (match by product AND size/variationId)
            const existingItemIndex = cart.items.findIndex(item => {
                const sameProduct = item.product.toString() === productId;
                const sameModel = (modelId ? (item.modelId && item.modelId.toString() === modelId) : !item.modelId);
                const sameVariation = variationId
                    ? (item.variationId && item.variationId.toString() === variationId)
                    : (size ? item.size === size : (!item.size && !item.variationId));
                return sameProduct && sameModel && sameVariation;
            });

            if (existingItemIndex > -1) {
                // Update quantity
                cart.items[existingItemIndex].quantity += quantity;
                // Validate new total quantity against stock
                if (!product.isOnDemand && limit < cart.items[existingItemIndex].quantity) {
                    return res.status(400).json({ message: `Insufficient stock for total quantity. Only ${limit} available.` });
                }
                cart.items[existingItemIndex].price = securePrice; // Update price secure
            } else {
                // Add new item
                cart.items.push({
                    product: productId,
                    quantity,
                    price: securePrice,
                    size,
                    variationId,
                    variationText,
                    modelId,
                    modelName
                });
            }
        }

        console.log('Saving cart...');
        await cart.save();
        console.log('Cart saved. Populating...');
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive gst_rate'
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
        const { productId, quantity, size, variationId, modelId } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => {
            const sameProduct = item.product.toString() === productId;
            const sameModel = (modelId ? (item.modelId && item.modelId.toString() === modelId) : !item.modelId);
            const sameVariation = variationId
                ? (item.variationId && item.variationId.toString() === variationId)
                : (size ? item.size === size : (!item.size && !item.variationId));
            return sameProduct && sameModel && sameVariation;
        });

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Validate stock
        const product = await Product.findById(productId);
        const user = await User.findById(req.user.id);

        let limit = 0;
        let securePrice = 0;

        if (product) {
            limit = product.stock;
            securePrice = product.selling_price_a || product.mrp;

            if (modelId && product.models) {
                const model = product.models.find(m => m._id.toString() === modelId);
                if (model) {
                    securePrice = model.selling_price_a || model.mrp || securePrice;
                    if (variationId) {
                        const variant = model.variations.find(v => v._id.toString() === variationId);
                        if (variant) {
                            limit = variant.stock;
                            securePrice = variant.price;
                        }
                    } else {
                        limit = model.variations.reduce((acc, v) => acc + (v.stock || 0), 0);
                    }
                }
            } else if (variationId && product.variations) {
                const variant = product.variations.find(v => v._id.toString() === variationId);
                if (variant) {
                    limit = variant.stock;
                    securePrice = variant.price;
                }
            }

            if (!product.isOnDemand && limit < quantity) {
                return res.status(400).json({ message: `Insufficient stock. Only ${limit} available.` });
            }

            // Apply Wholesale Discount
            if (user && user.customerType === 'wholesale' && user.wholesaleDiscount > 0) {
                const discountAmount = (securePrice * user.wholesaleDiscount) / 100;
                securePrice = Math.round((securePrice - discountAmount) * 100) / 100;
            }

            // Only update price if it's NOT a special request item
            if (!cart.items[itemIndex].requestId) {
                cart.items[itemIndex].price = securePrice;
            }
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive gst_rate'
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
        const { productId, size, variationId, modelId } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => {
            const sameProduct = item.product.toString() === productId;
            const sameModel = (modelId ? (item.modelId && item.modelId.toString() === modelId) : !item.modelId);
            const sameVariation = variationId
                ? (item.variationId && item.variationId.toString() === variationId)
                : (size ? item.size === size : (!item.size && !item.variationId));
            return !(sameProduct && sameModel && sameVariation);
        });

        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive gst_rate'
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

        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        const discount = (user?.customerType === 'wholesale' && user.wholesaleDiscount) ? user.wholesaleDiscount : 0;

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const Product = require('../models/Product');

        for (const localItem of localCartItems) {
            // Fetch real product to get safe price
            const product = await Product.findById(localItem.productId);
            if (!product || !product.isActive) continue;

            let dbPrice = product.selling_price_a || product.mrp;
            let variationText = localItem.variationText || '';
            let modelName = localItem.modelName || '';

            // Handle Models/Variations
            if (localItem.modelId) {
                const model = product.models?.find(m => m._id.toString() === localItem.modelId);
                if (model) {
                    dbPrice = model.selling_price_a || model.mrp || dbPrice;
                    modelName = model.name;
                    if (localItem.variationId) {
                        const variant = model.variations?.find(v => v._id.toString() === localItem.variationId);
                        if (variant) {
                            dbPrice = variant.price || dbPrice;
                            variationText = `${variant.type}: ${variant.value}`;
                        }
                    }
                }
            } else if (localItem.variationId) {
                const variant = product.variations?.find(v => v._id.toString() === localItem.variationId);
                if (variant) {
                    dbPrice = variant.price || dbPrice;
                    variationText = `${variant.type}: ${variant.value}`;
                }
            }

            // Apply Wholesale Discount
            if (discount > 0) {
                dbPrice = Math.round(dbPrice * (1 - discount / 100));
            }

            const existingItemIndex = cart.items.findIndex(item =>
                item.product.toString() === localItem.productId &&
                (localItem.modelId ? (item.modelId && item.modelId.toString() === localItem.modelId) : !item.modelId) &&
                (localItem.variationId ? (item.variationId && item.variationId.toString() === localItem.variationId) : (localItem.size ? item.size === localItem.size : !item.size))
            );

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += localItem.quantity;
                cart.items[existingItemIndex].price = dbPrice; // Trusted price from DB
            } else {
                cart.items.push({
                    product: localItem.productId,
                    quantity: localItem.quantity,
                    price: dbPrice,
                    size: localItem.size,
                    variationId: localItem.variationId,
                    variationText: variationText,
                    modelId: localItem.modelId,
                    modelName: modelName
                });
            }
        }

        await cart.save();
        await cart.populate({
            path: 'items.product',
            select: 'title basePrice discountedPrice featured_image gallery_images stock isOnDemand category isActive gst_rate'
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
