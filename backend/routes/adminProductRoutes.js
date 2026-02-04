const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { body, validationResult } = require('express-validator'); // Import validator
const { createProduct, updateProduct, deleteProduct, getAdminProducts, getAdminProductById } = require('../controllers/productController');

// Validation Middleware for Product
const validateProduct = [
    body('title').notEmpty().withMessage('Product title is required').trim(),
    body('category').notEmpty().withMessage('Category is required'),
    body('mrp').isNumeric().withMessage('MRP must be a number'),
    body('selling_price_a').optional().isNumeric().withMessage('Selling Price A must be a number'),
    // Middleware to check for errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation Error', errors: errors.array() });
        }
        next();
    }
];

// Upload configuration for product images
const productUploads = upload.any(); // Allow dynamic fields for variations
// const productUploads = upload.fields([
//     { name: 'featured_image', maxCount: 1 },
//     { name: 'featured_image_2', maxCount: 1 },
//     { name: 'size_chart', maxCount: 1 },
//     { name: 'gallery_images', maxCount: 10 }
// ]);

// Helper for patch (keep existing logic or move to controller? Keeping here for now to avoid breaking existing workflow if any)
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
        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({
            message: `Product ${isNewArrival ? 'marked as' : 'removed from'} New Arrival`,
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating new arrival status", error: err.message });
    }
});

// CRUD Routes
router.get('/', protect, admin, getAdminProducts);
router.get('/:id', protect, admin, getAdminProductById);
router.post('/', protect, admin, productUploads, validateProduct, createProduct); // Added validateProduct
router.put('/:id', protect, admin, productUploads, validateProduct, updateProduct); // Added validateProduct
router.delete('/:id', protect, admin, deleteProduct);

// Quick Stock Update
router.patch('/:id/stock', protect, admin, async (req, res) => {
    try {
        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(req.params.id, { stock: stock }, { new: true });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;
