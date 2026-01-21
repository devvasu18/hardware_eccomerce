const express = require('express');
const router = express.Router();
const ProcurementRequest = require('../models/ProcurementRequest');
const Product = require('../models/Product');

// Submit a Request (Hybrid Logic)
router.post('/', async (req, res) => {
    try {
        const { productId, quantity, customerContact } = req.body;

        // 1. Fetch Product to validate
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // 2. Logic: If quantity > stock, it is a VALID request. 
        // If quantity <= stock, frontend should have handled it as "Buy Now", 
        // but we can accept requests even for in-stock items if user prefers negotiation.

        const newRequest = new ProcurementRequest({
            product: productId,
            requestedQuantity: quantity,
            currentStockAtRequest: product.stock,
            customerContact: customerContact, // { name, mobile }
            // user: req.user._id // if auth middleware exists
        });

        const savedRequest = await newRequest.save();
        res.status(201).json({ success: true, message: 'Request submitted successfully', id: savedRequest._id });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Requests (Admin)
router.get('/', async (req, res) => {
    try {
        const requests = await ProcurementRequest.find().populate('product');
        res.json(requests);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Admin Respond to Request
router.patch('/:id/respond', async (req, res) => {
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
        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
