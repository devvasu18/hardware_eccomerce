const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Create Product
// Create Product
router.post('/', async (req, res) => {
    try {
        const { basePrice, discountedPrice } = req.body;

        // Validation: Discount price cannot be greater than original price
        if (discountedPrice && basePrice && Number(discountedPrice) > Number(basePrice)) {
            return res.status(400).json({ message: "Discount Price cannot be greater than Original Price (Base Price)." });
        }

        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Featured Products (must come before generic GET /)
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ isVisible: true, isFeatured: true })
            .populate('category', 'name');
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Top Sales Products
router.get('/top-sales', async (req, res) => {
    try {
        const products = await Product.find({ isVisible: true, isTopSale: true })
            .populate('category', 'name');
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Daily Offers
router.get('/daily-offers', async (req, res) => {
    try {
        const products = await Product.find({ isVisible: true, isDailyOffer: true })
            .populate('category', 'name');
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get New Arrivals
router.get('/new-arrivals', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 0;

        // Query: Only visible, in-stock products marked as New Arrival
        // If sorting by latest created date is also needed as a fallback, we could expand this.
        // But the requirement says "Mark any product as New Arrival" and "Everything must be managed from Admin", 
        // so we'll fetch products where isNewArrival is true.
        const query = {
            isVisible: true,
            isNewArrival: true,
            stock: { $gt: 0 }
        };

        let productsQuery = Product.find(query)
            .populate('category', 'name')
            .sort({ newArrivalPriority: -1, newArrivalCreatedAt: -1, createdAt: -1 });

        if (limit > 0) {
            productsQuery = productsQuery.limit(limit);
        }

        const products = await productsQuery;
        res.json(products);
    } catch (err) {
        console.error('Error fetching new arrivals:', err);
        res.status(500).json({ message: "Error fetching new arrivals", error: err.message });
    }
});

// Get Products
router.get('/', async (req, res) => {
    try {
        const query = { isVisible: true };

        // Handle category query param
        if (req.query.category) {
            console.log(`[API] Filtering by category: "${req.query.category}"`);
            // Case-insensitive regex match for better UX
            query.category = { $regex: new RegExp(`^${req.query.category}$`, 'i') };
        } else {
            console.log('[API] No category filter provided. Fetching all visible products.');
        }

        const products = await Product.find(query)
            .populate('category', 'name');
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Single Product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update Product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
