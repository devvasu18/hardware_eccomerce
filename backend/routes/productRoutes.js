const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');
const { advancedSearch, getRecommendations } = require('../utils/searchSmart');


// Create Product
router.post('/', protect, admin, async (req, res) => {
    try {
        const { basePrice, discountedPrice } = req.body;

        // Validation: Discount price cannot be greater than original price
        if (discountedPrice && basePrice && Number(discountedPrice) > Number(basePrice)) {
            return res.status(400).json({ message: "Discount Price cannot be greater than Original Price (Base Price)." });
        }

        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        await logAction({ action: 'CREATE_PRODUCT', req, targetResource: 'Product', targetId: savedProduct._id, details: { title: savedProduct.title } });
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create product', error: err.message });
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
// Get Products with advanced filtering
router.get('/', async (req, res) => {
    try {
        const { category, keyword, minPrice, maxPrice, brand, sort, page = 1, limit = 20 } = req.query;

        const query = { isVisible: true };

        // 1. Category Filter (Name -> ID lookup)
        if (category) {
            // Check if it's an ID or Name. IDs are 24 hex chars. 
            // Simple check: if it matches ObjectId format, use it directly. Else look up name.
            if (/^[0-9a-fA-F]{24}$/.test(category)) {
                query.category = category;
            } else {
                const Category = require('../models/Category'); // Lazy load
                const catDoc = await Category.findOne({
                    $or: [
                        { slug: category },
                        { name: category } // Prefer exact match or handle case-insensitivity via collation/schema
                    ]
                });
                if (catDoc) {
                    query.category = catDoc._id;
                } else {
                    // Category name not found, so no products should match
                    // Return empty immediately or ensure query returns nothing
                    return res.json({ products: [], page: Number(page), pages: 0, count: 0 });
                }
            }
        }

        // Subcategory Filter
        if (req.query.subcategory) {
            const SubCategory = require('../models/SubCategory');
            const subCatDoc = await SubCategory.findOne({
                $or: [
                    { slug: req.query.subcategory },
                    { name: req.query.subcategory }
                ]
            });

            if (subCatDoc) {
                query.sub_category = subCatDoc._id;
            } else {
                return res.json({ products: [], page: Number(page), pages: 0, count: 0 });
            }
        }

        // 2. Keyword Search (Advanced Fuzzy Search)
        if (keyword) {
            const { products: searchProducts, count: searchCount } = await advancedSearch(keyword, { limit, page });

            // If we are doing a keyword search, we override the normal fetch logic
            // to preserve the relevance ranking provided by Advanced Search.
            if (req.query.page) {
                return res.json({
                    products: searchProducts,
                    page: Number(page),
                    pages: Math.ceil(searchCount / limit),
                    count: searchCount
                });
            } else {
                return res.json(searchProducts);
            }
        }

        // 3. Price Filter (Using selling_price_a as the main price)
        if (minPrice || maxPrice) {
            query.selling_price_a = {};
            if (minPrice) query.selling_price_a.$gte = Number(minPrice);
            if (maxPrice) query.selling_price_a.$lte = Number(maxPrice);
        }

        // 4. Availability Filter
        if (req.query.inStock === 'true') {
            query.stock = { $gt: 0 };
            query.isOnDemand = { $ne: true }; // On-demand are technically always "available" but often handled separately
        }

        // 4. Brand Filter
        if (brand) {
            // Check if it's an ID or Name/Slug. IDs are 24 hex chars.
            if (/^[0-9a-fA-F]{24}$/.test(brand)) {
                query.brand = brand;
            } else {
                const Brand = require('../models/Brand'); // Lazy load
                // Try to find by slug first (exact match), then name (regex)
                const brandDoc = await Brand.findOne({
                    $or: [
                        { slug: brand },
                        { name: brand }
                    ]
                });
                if (brandDoc) {
                    query.brand = brandDoc._id;
                } else {
                    // Brand not found, force empty result
                    return res.json(req.query.page ? { products: [], page: Number(page), pages: 0, count: 0 } : []);
                }
            }
        }

        // 5. Batch ID Fetch (for Wishlist/Cart)
        if (req.query.ids) {
            const idList = req.query.ids.split(',').filter(id => /^[0-9a-fA-F]{24}$/.test(id));
            if (idList.length > 0) {
                query._id = { $in: idList };
            }
        }

        // Pagination
        const pageSize = Number(limit);
        const pageNum = Number(page);

        // Sorting
        let sortOption = { createdAt: -1 }; // Default: Newest
        if (sort === 'price_asc') sortOption = { selling_price_a: 1 };
        if (sort === 'price_desc') sortOption = { selling_price_a: -1 };
        if (sort === 'name_asc') sortOption = { title: 1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };
        if (sort === 'most_viewed') sortOption = { views: -1 };
        if (sort === 'most_purchased') sortOption = { salesCount: -1 };

        const count = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('offers', 'title percentage')
            .sort(sortOption)
            .limit(pageSize)
            .skip(pageSize * (pageNum - 1));

        // Return standardized paginated response (or just array if frontend expects array, 
        // but for "real production" pagination is key.
        // Based on previous code, frontend might expect just an array. 
        // Let's check if we should break that contract. 
        // Existing frontend code: `const res = await fetch... return res.json()` -> expects array?
        // Let's return ARRAY by default to maintain compatibility, unless ?paginated=true is passed?
        // OR better: Just return Array if no explicit pagination requested?
        // Actually, robustness means I should try to keep API contract.
        // Previous Code: `res.json(products);` -> Array.

        // If the user requested specific page, they can handle object response?
        // To be safe and fix the "fetched properly" requirement without breaking frontend:
        // formatting:

        if (req.query.page) {
            res.json({ products, page: pageNum, pages: Math.ceil(count / pageSize), count });
        } else {
            res.json(products);
        }

    } catch (err) {
        console.error("Product Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch products", error: err.message });
    }
});

// Get Single Product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('offers')
            .populate('sub_category', 'name');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update Product
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logAction({ action: 'UPDATE_PRODUCT', req, targetResource: 'Product', targetId: req.params.id, details: req.body });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update product', error: err.message });
    }
});

// Increment Product View
router.put('/:id/view', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ message: "Error incrementing view" });
    }
});

// Get Recommendations for a product
// @route   GET /api/products/:id/recommendations
router.get('/:id/recommendations', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 4;
        const recommendations = await getRecommendations(req.params.id, limit);
        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch recommendations", error: err.message });
    }
});

module.exports = router;
