const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Toggle/Update New Arrival status for a product
// @route   PATCH /api/admin/products/:id/new-arrival
// @access  Admin only
router.patch('/:id/new-arrival', protect, admin, async (req, res) => {
    try {
        const { isNewArrival, newArrivalPriority } = req.body;

        const updateData = {
            isNewArrival: isNewArrival,
            newArrivalCreatedAt: isNewArrival ? new Date() : undefined
        };

        if (newArrivalPriority !== undefined) {
            updateData.newArrivalPriority = newArrivalPriority;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: `Product ${isNewArrival ? 'marked as' : 'removed from'} New Arrival`,
            product: updatedProduct
        });
    } catch (err) {
        console.error('Error updating new arrival status:', err);
        res.status(500).json({ message: "Error updating new arrival status", error: err.message });
    }
});

module.exports = router;
