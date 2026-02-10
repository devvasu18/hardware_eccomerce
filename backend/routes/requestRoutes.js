const express = require('express');
const router = express.Router();
const ProcurementRequest = require('../models/ProcurementRequest');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

const jwt = require('jsonwebtoken'); // Ensure jwt is available
const Cart = require('../models/Cart');
const tallyService = require('../services/tallyService'); // Import Tally Service

// Submit a Request (Hybrid Logic)
router.post('/', async (req, res) => {
    try {
        const { productId, quantity, customerContact, modelId, variationId, declaredBasePrice } = req.body;

        // 1. Fetch Product to validate
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Identify User (Optional)
        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (e) {
                console.log('Token decode failed in request submit', e.message);
            }
        }

        // Lookup Names for Admin Clarity
        let modelName = undefined;
        let variationText = undefined;

        if (modelId && product.models) {
            const m = product.models.find(m => m._id.toString() === modelId);
            if (m) modelName = m.name;
        }

        if (variationId) {
            let v = null;
            if (modelId && product.models) {
                const m = product.models.find(m => m._id.toString() === modelId);
                if (m && m.variations) v = m.variations.find(v => v._id.toString() === variationId);
            } else if (product.variations) {
                v = product.variations.find(v => v._id.toString() === variationId);
            }

            if (v) variationText = `${v.type}: ${v.value}`;
        }

        const newRequest = new ProcurementRequest({
            product: productId,
            requestedQuantity: quantity,
            currentStockAtRequest: product.stock,
            declaredBasePrice: declaredBasePrice,
            customerContact: customerContact, // { name, mobile }
            user: userId,
            modelId: modelId || undefined,
            variationId: variationId || undefined,
            modelName: modelName,
            variationText: variationText
        });

        const savedRequest = await newRequest.save();

        // Async Tally Sync (Non-blocking)
        tallyService.syncOnDemandToTally(savedRequest._id)
            .then(result => {
                if (!result.success && !result.queued) {
                    console.error('Failed to sync Request to Tally:', result.error);
                }
            })
            .catch(err => console.error('Tally Sync Trigger Error:', err));

        res.status(201).json({ success: true, message: 'Request submitted successfully', id: savedRequest._id });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Requests (Admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const requests = await ProcurementRequest.find().populate('product');
        res.json(requests);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Admin Respond to Request
router.patch('/:id/respond', protect, admin, async (req, res) => {
    try {
        const { status, priceQuote, estimatedDelivery, adminNotes } = req.body;

        const updateData = {
            status,
            adminResponse: {
                priceQuote,
                estimatedDelivery,
                adminNotes,
                respondedAt: new Date()
            }
        };

        const updatedRequest = await ProcurementRequest.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // --- AUTO ADD TO CART IF APPROVED ---
        if (status === 'Approved' && updatedRequest.user && priceQuote) {
            try {
                let cart = await Cart.findOne({ user: updatedRequest.user });
                if (!cart) {
                    cart = new Cart({ user: updatedRequest.user, items: [] });
                }

                // Check for duplicate request in cart
                const exists = cart.items.find(i => i.requestId && i.requestId.toString() === updatedRequest._id.toString());

                if (!exists) {
                    cart.items.push({
                        product: updatedRequest.product,
                        quantity: updatedRequest.requestedQuantity,
                        price: priceQuote, // Quoted Price
                        requestId: updatedRequest._id
                    });
                    await cart.save();
                    console.log(`[Request] Auto-added request ${updatedRequest._id} to user ${updatedRequest.user} cart`);
                }
            } catch (cartErr) {
                console.error('Failed to auto-add approved request to cart:', cartErr);
            }
        }

        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
