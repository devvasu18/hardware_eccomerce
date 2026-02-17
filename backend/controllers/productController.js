const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const HSNCode = require('../models/HSNCode');
const fs = require('fs');
const csv = require('csv-parser');
const { deleteFile } = require('../utils/fileHandler');
const { logAction } = require('../utils/auditLogger');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const tallyService = require('../services/tallyService');
const { generateStockItemXML } = require('../utils/tallyStockItemGenerator');
const SystemSettings = require('../models/SystemSettings');

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Admin
exports.getAdminProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const status = req.query.status || 'active'; // 'active', 'inactive', 'all'
        const category = req.query.category;
        const sub_category = req.query.sub_category;

        let query = {};

        // Status Filter
        if (status === 'active') {
            query.isActive = { $ne: false }; // active or undefined = active
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Category Filter
        if (category) query.category = category;

        // SubCategory Filter
        if (sub_category) query.sub_category = sub_category;

        // Search Filter
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };

            // Find related Brands and Categories
            const brands = await Brand.find({ name: searchRegex }).select('_id');
            const categories = await Category.find({ name: searchRegex }).select('_id');

            const brandIds = brands.map(b => b._id);
            const categoryIds = categories.map(c => c._id);

            query.$or = [
                { 'title.en': searchRegex },
                { 'title.hi': searchRegex },
                { slug: searchRegex },
                { part_number: searchRegex },
                { 'variations.sku': searchRegex },
                { 'models.variations.sku': searchRegex },
                { 'variations.value.en': searchRegex },
                { 'variations.value.hi': searchRegex },
                { 'models.variations.value.en': searchRegex },
                { 'models.variations.value.hi': searchRegex },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } }
            ];
        }

        const total = await Product.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('sub_category', 'name')
            .populate('brand', 'name')
            .populate('offers', 'title percentage')
            .populate('hsn_code', 'hsn_code gst_rate')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            products,
            currentPage: page,
            totalPages,
            totalProducts: total
        });
    } catch (error) {
        console.error('Error fetching admin products:', error);
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
};

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Admin
exports.getAdminProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('sub_category')
            .populate('brand')
            .populate('offers')
            .populate('hsn_code');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
};

// @desc    Create new product
// @route   POST /api/admin/products
// @access  Admin
exports.createProduct = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Create Product Request Recieved');
            // console.log('Body:', req.body); // Too verbose/sensitive
        }

        // Parse Title if JSON string
        if (req.body.title && typeof req.body.title === 'string') {
            try {
                const parsedTitle = JSON.parse(req.body.title);
                if (typeof parsedTitle === 'object') req.body.title = parsedTitle;
            } catch (e) { }
        }

        const {
            title, slug, subtitle, part_number,
            category, sub_category, brand, offers,
            hsn_code, gst_rate,
            description, specifications,
            mrp, selling_price_a, selling_price_b, selling_price_c, delivery_charge,
            opening_stock, max_unit_buy, product_quantity, low_stock_threshold,
            color_name, color_hex, size,
            meta_title, meta_description, keywords,
            isActive, isVisible, isFeatured, isNewArrival, isTopSale, isDailyOffer,
            isOnDemand, isCancellable, isReturnable, deliveryTime, returnWindow
        } = req.body;

        // Helper to parse bilingual fields
        const parseBilingual = (field) => {
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    return (typeof parsed === 'object') ? parsed : field;
                } catch (e) { return field; }
            }
            return field;
        };

        const parsedMetaTitle = parseBilingual(meta_title);
        const parsedMetaDesc = parseBilingual(meta_description);
        const parsedSubtitle = parseBilingual(subtitle);
        const parsedDescription = parseBilingual(description);
        const parsedDeliveryTime = parseBilingual(deliveryTime);

        // Extract file paths from req.files (array)
        const getFile = (name) => req.files?.find(f => f.fieldname === name);
        const getFiles = (name) => req.files?.filter(f => f.fieldname === name) || [];

        const featured_image = getFile('featured_image')?.path || req.body.featured_image;
        const featured_image_2 = getFile('featured_image_2')?.path || req.body.featured_image_2;
        const size_chart = getFile('size_chart')?.path || req.body.size_chart;
        const gallery_images = getFiles('gallery_images').map(f => f.path);

        // Parse Product Images (New Modal System)
        let parsedImages = [];
        if (req.body.images) {
            try {
                // If coming as a string (JSON)
                const rawImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
                if (Array.isArray(rawImages)) {
                    parsedImages = rawImages.map((img, idx) => {
                        // Check for new file upload keyed by index
                        const file = req.files?.find(f => f.fieldname === `product_image_${idx}`);
                        if (file) {
                            return { ...img, url: file.path };
                        }
                        return img;
                    });
                }
            } catch (e) {
                console.error('Error parsing product images:', e);
            }
        } else if (featured_image) {
            // Legacy Fallback: If no 'images' array but 'featured_image' exists, create one entry
            parsedImages.push({ url: featured_image, isMain: true });
            if (featured_image_2) parsedImages.push({ url: featured_image_2, isMain: false });
            if (gallery_images.length > 0) {
                gallery_images.forEach(url => parsedImages.push({ url, isMain: false }));
            }
        }

        // Helper to parse specifications (array of bilingual objects)
        let parsedSpecs = [];
        if (specifications) {
            if (typeof specifications === 'string') {
                try {
                    parsedSpecs = JSON.parse(specifications);
                } catch (e) {
                    console.error("Error parsing specifications:", e);
                    parsedSpecs = []; // Default to empty array on parse error
                }
            } else {
                parsedSpecs = specifications;
            }
        }

        // Parse Keywords (Bilingual Array)
        let parsedKeywords = parseBilingual(keywords);
        if (parsedKeywords) {
            if (typeof parsedKeywords === 'object' && !Array.isArray(parsedKeywords)) {
                if (typeof parsedKeywords.en === 'string') parsedKeywords.en = parsedKeywords.en.split(',').map(k => k.trim()).filter(k => k);
                if (typeof parsedKeywords.hi === 'string') parsedKeywords.hi = parsedKeywords.hi.split(',').map(k => k.trim()).filter(k => k);
            } else if (typeof parsedKeywords === 'string') {
                // Legacy support
                parsedKeywords = {
                    en: parsedKeywords.split(',').map(k => k.trim()).filter(k => k),
                    hi: []
                };
            }
        }

        let parsedSubCats = sub_category;
        if (typeof sub_category === 'string') {
            // If comma separated or single value
            parsedSubCats = [sub_category];
        }

        let parsedOffers = offers;
        if (typeof offers === 'string') {
            // Handle if passed as string (single ID or stringified array)
            try {
                parsedOffers = JSON.parse(offers);
            } catch (e) {
                // assume comma separated
                parsedOffers = offers.split(',').map(id => id.trim()).filter(id => id);
            }
            if (!Array.isArray(parsedOffers)) parsedOffers = [parsedOffers];
        }

        let parsedVariations = [];
        if (req.body.variations && typeof req.body.variations === 'string') {
            try {
                parsedVariations = JSON.parse(req.body.variations);
            } catch (e) {
                console.error('Error parsing variations:', e);
            }
        } else if (req.body.variations) {
            parsedVariations = req.body.variations;
        }

        // Parse and Handle Models (Enhanced System)
        let parsedModels = [];
        if (req.body.models && typeof req.body.models === 'string') {
            try {
                parsedModels = JSON.parse(req.body.models);
                // Map model-level images and variation images
                if (req.files) {
                    parsedModels.forEach((m, mIdx) => {
                        const mFile = req.files.find(f => f.fieldname === `model_image_${mIdx}`);
                        if (mFile) m.featured_image = mFile.path;

                        if (m.variations) {
                            m.variations.forEach((v, vIdx) => {
                                const mvFile = req.files.find(f => f.fieldname === `model_${mIdx}_variation_image_${vIdx}`);
                                if (mvFile) v.image = mvFile.path;
                            });
                        }
                    });
                }
            } catch (e) { console.error('Error parsing models:', e); }
        }

        const product = new Product({
            title, slug, subtitle: parsedSubtitle, part_number,
            category, sub_category: parsedSubCats, brand, offers: parsedOffers,
            hsn_code, gst_rate,
            description: parsedDescription, specifications: parsedSpecs,
            mrp, selling_price_a, selling_price_b, selling_price_c, delivery_charge,
            opening_stock, max_unit_buy, product_quantity, low_stock_threshold,
            color_name, color_hex, size,
            featured_image, featured_image_2, size_chart, gallery_images,
            meta_title: parsedMetaTitle, meta_description: parsedMetaDesc, keywords: parsedKeywords,
            isActive, isVisible, isFeatured, isNewArrival, isTopSale, isDailyOffer,
            isOnDemand: isOnDemand === 'true' || isOnDemand === true,
            isCancellable: isCancellable !== false && isCancellable !== 'false',
            isReturnable: isReturnable !== false && isReturnable !== 'false',
            deliveryTime: parsedDeliveryTime, returnWindow,
            variations: parsedVariations,
            models: parsedModels,
            images: parsedImages
        });

        const createdProduct = await product.save();
        await logAction({ action: 'CREATE_PRODUCT_ADMIN', req, targetResource: 'Product', targetId: createdProduct._id, details: { title: createdProduct.title } });
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error('Error creating product:', error);
        // Cleanup uploaded files if error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => deleteFile(file.path));
        }
        res.status(400).json({ message: 'Product creation failed', error: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Admin
exports.updateProduct = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Update Product Request: ${req.params.id}`);
            console.log('Request Body Keys:', Object.keys(req.body));
            if (!req.body.category) console.warn('⚠️ Category missing in request body!');
            if (!req.body.mrp) console.warn('⚠️ MRP missing in request body!');
            console.log('Files uploaded:', req.files?.map(f => f.fieldname));
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields (Similar extraction as Create)
        // Note: For files, if new file uploaded, delete old one and set new path.
        // This logic can be complex, for brevity I'll handle key images.

        // ... Implementation of updates ...
        // Quick update implementation for core fields:
        const updates = { ...req.body };

        // Helper to parse bilingual fields
        const parseBilingual = (field) => {
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    return (typeof parsed === 'object') ? parsed : field;
                } catch (e) { return field; }
            }
            return field;
        };

        if (updates.meta_title) updates.meta_title = parseBilingual(updates.meta_title);
        if (updates.meta_description) updates.meta_description = parseBilingual(updates.meta_description);
        if (updates.subtitle) updates.subtitle = parseBilingual(updates.subtitle);
        if (updates.description) updates.description = parseBilingual(updates.description);
        if (updates.deliveryTime) updates.deliveryTime = parseBilingual(updates.deliveryTime);

        // Parse Title if JSON string
        if (updates.title && typeof updates.title === 'string') {
            try {
                const parsedTitle = JSON.parse(updates.title);
                if (typeof parsedTitle === 'object') updates.title = parsedTitle;
            } catch (e) { }
        }

        // Helper to get file from array
        const getFile = (name) => req.files?.find(f => f.fieldname === name);

        // Handle featured_image
        if (req.body.featured_image && typeof req.body.featured_image === 'string') {
            // String URL passed
            if (product.featured_image && product.featured_image !== req.body.featured_image && req.body.featured_image.startsWith('http')) {
                deleteFile(product.featured_image);
            }
            updates.featured_image = req.body.featured_image;
        } else {
            const file = getFile('featured_image');
            if (file) {
                if (product.featured_image) deleteFile(product.featured_image);
                updates.featured_image = file.path;
            }
        }

        // Handle featured_image_2
        if (req.body.featured_image_2 && typeof req.body.featured_image_2 === 'string') {
            if (product.featured_image_2 && product.featured_image_2 !== req.body.featured_image_2 && req.body.featured_image_2.startsWith('http')) {
                deleteFile(product.featured_image_2);
            }
            updates.featured_image_2 = req.body.featured_image_2;
        } else {
            const file = getFile('featured_image_2');
            if (file) {
                if (product.featured_image_2) deleteFile(product.featured_image_2);
                updates.featured_image_2 = file.path;
            }
        }

        // Handle Product Images (New Modal System)
        if (req.body.images) {
            try {
                // Parse if string
                const rawImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;

                if (Array.isArray(rawImages)) {
                    const existingImages = product.images || [];

                    updates.images = rawImages.map((img, idx) => {
                        const file = req.files?.find(f => f.fieldname === `product_image_${idx}`);

                        // If new file uploaded
                        if (file) {
                            // Logic to delete old file? 
                            // If this index replaced an existing image that had a URL, we might want to delete it.
                            // But since indices can shift, it's safer not to aggressively delete unless we know ID matches.
                            // For simplicity, we just set the new URL.
                            return { ...img, url: file.path };
                        }
                        return img;
                    });
                }
            } catch (e) {
                console.error('Error parsing update product images:', e);
            }
        }

        // Helper to parse if string
        if (updates.specifications) {
            if (typeof updates.specifications === 'string') {
                try {
                    updates.specifications = JSON.parse(updates.specifications);
                } catch (e) {
                    console.error('Error parsing specifications:', e);
                    updates.specifications = []; // Default to empty array on parse error
                }
            }
        }

        if (updates.keywords) {
            let kw = parseBilingual(updates.keywords);
            if (kw) {
                if (typeof kw === 'object' && !Array.isArray(kw)) {
                    if (typeof kw.en === 'string') kw.en = kw.en.split(',').map(k => k.trim()).filter(k => k);
                    if (typeof kw.hi === 'string') kw.hi = kw.hi.split(',').map(k => k.trim()).filter(k => k);
                    updates.keywords = kw;
                } else if (typeof kw === 'string') {
                    updates.keywords = {
                        en: kw.split(',').map(k => k.trim()).filter(k => k),
                        hi: []
                    };
                }
            }
        }

        if (updates.sub_category && typeof updates.sub_category === 'string') {
            // Handle comma separated or single value
            updates.sub_category = updates.sub_category.split(',').map(id => id.trim()).filter(id => id);
        }

        if (updates.offers && typeof updates.offers === 'string') {
            try {
                updates.offers = JSON.parse(updates.offers);
            } catch (e) {
                updates.offers = updates.offers.split(',').map(id => id.trim()).filter(id => id);
            }
            if (!Array.isArray(updates.offers)) updates.offers = [updates.offers];
        }

        // Handle boolean fields from form-data (strings "true"/"false")
        if (updates.isActive !== undefined) updates.isActive = updates.isActive === 'true' || updates.isActive === true;
        if (updates.isVisible !== undefined) updates.isVisible = updates.isVisible === 'true' || updates.isVisible === true;
        if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === 'true' || updates.isFeatured === true;
        if (updates.isNewArrival !== undefined) updates.isNewArrival = updates.isNewArrival === 'true' || updates.isNewArrival === true;
        if (updates.isTopSale !== undefined) updates.isTopSale = updates.isTopSale === 'true' || updates.isTopSale === true;
        if (updates.isDailyOffer !== undefined) updates.isDailyOffer = updates.isDailyOffer === 'true' || updates.isDailyOffer === true;
        if (updates.isOnDemand !== undefined) updates.isOnDemand = updates.isOnDemand === 'true' || updates.isOnDemand === true;
        if (updates.isCancellable !== undefined) updates.isCancellable = updates.isCancellable === 'true' || updates.isCancellable === true;
        if (updates.isReturnable !== undefined) updates.isReturnable = updates.isReturnable === 'true' || updates.isReturnable === true;

        if (updates.variations && typeof updates.variations === 'string') {
            try {
                updates.variations = JSON.parse(updates.variations);
                // Map uploaded variation images
                if (req.files) {
                    updates.variations.forEach((v, index) => {
                        const vFile = req.files.find(f => f.fieldname === `variation_image_${index}`);
                        if (vFile) {
                            if (v._id) {
                                const oldVar = product.variations.find(ov => ov._id.toString() === v._id);
                                if (oldVar && oldVar.image) deleteFile(oldVar.image);
                            }
                            v.image = vFile.path;
                        }
                    });
                }
            } catch (e) { console.error('Error parsing variations:', e); }
        }

        // Handle Models Update
        if (updates.models && typeof updates.models === 'string') {
            try {
                updates.models = JSON.parse(updates.models);
                if (req.files) {
                    updates.models.forEach((m, mIdx) => {
                        const mFile = req.files.find(f => f.fieldname === `model_image_${mIdx}`);
                        if (mFile) {
                            // Find existing model to delete old image
                            if (m._id) {
                                const oldModel = product.models.find(om => om._id.toString() === m._id);
                                if (oldModel && oldModel.featured_image) deleteFile(oldModel.featured_image);
                            }
                            m.featured_image = mFile.path;
                        }

                        if (m.variations) {
                            m.variations.forEach((v, vIdx) => {
                                const mvFile = req.files.find(f => f.fieldname === `model_${mIdx}_variation_image_${vIdx}`);
                                if (mvFile) {
                                    if (v._id && m._id) {
                                        const oldModel = product.models.find(om => om._id.toString() === m._id);
                                        const oldVar = oldModel?.variations.find(ov => ov._id.toString() === v._id);
                                        if (oldVar && oldVar.image) deleteFile(oldVar.image);
                                    }
                                    v.image = mvFile.path;
                                }
                            });
                        }
                    });
                }
            } catch (e) { console.error('Error parsing models:', e); }
        }

        // Helper to sanitize numeric fields (convert "" to undefined)
        const sanitizeNumber = (val) => (val === '' ? undefined : val);
        const numberFields = ['mrp', 'selling_price_a', 'selling_price_b', 'selling_price_c', 'delivery_charge', 'opening_stock', 'max_unit_buy', 'low_stock_threshold', 'gst_rate'];

        numberFields.forEach(field => {
            if (updates[field] !== undefined) updates[field] = sanitizeNumber(updates[field]);
        });

        // Parse and Sanitize Models
        // Note: Already parsed above at line 403-434, no need to re-parse.
        // We just ensure updates.models is an array for the following sanitation logic.

        // Since the previous code block (lines 306-337) ALREADY processed models/variations and images, 
        // `updates.models` and `updates.variations` are already Objects (if they were present).
        // We just need to sanitize numbers inside them.

        if (Array.isArray(updates.models)) {
            updates.models.forEach(m => {
                ['mrp', 'selling_price_a'].forEach(f => { if (m[f] !== undefined) m[f] = sanitizeNumber(m[f]); });
                if (Array.isArray(m.variations)) {
                    m.variations.forEach(v => {
                        ['price', 'mrp', 'stock'].forEach(f => { if (v[f] !== undefined) v[f] = sanitizeNumber(v[f]); });
                    });
                }
            });
        }

        if (Array.isArray(updates.variations)) {
            updates.variations.forEach(v => {
                ['price', 'mrp', 'stock'].forEach(f => { if (v[f] !== undefined) v[f] = sanitizeNumber(v[f]); });
            });
        }

        // Filter out immutable fields
        const immutableFields = ['_id', 'createdAt', 'updatedAt', '__v'];
        immutableFields.forEach(field => delete updates[field]);

        // Apply updates
        product.set(updates);

        console.log('Product object before save:', product);
        const updatedProduct = await product.save();
        await logAction({ action: 'UPDATE_PRODUCT_ADMIN', req, targetResource: 'Product', targetId: req.params.id, details: { title: updatedProduct.title } });
        res.json(updatedProduct);

    } catch (error) {
        console.error('Error updating product:', error);
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            const details = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message: 'Validation Failed', detail: details, error: error.message });
        }
        res.status(400).json({ message: 'Product update failed', error: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // SOFT DELETE: Mark as inactive instead of removing document
        // This preserves historical order data integrity
        product.isActive = false;
        product.isVisible = false;

        // Note: We DO NOT delete images here so that historical orders can still show them
        // if we ever implement a "Archive View".

        await product.save();
        await logAction({ action: 'DELETE_PRODUCT_ADMIN', req, targetResource: 'Product', targetId: req.params.id, details: { title: product.title, mode: 'soft-delete' } });
        res.json({ message: 'Product deactivated (Soft Delete)' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

// @desc    Bulk Import Products from CSV
// @route   POST /api/admin/products/bulk-import
// @access  Admin
exports.bulkImportProducts = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const file = req.files[0];
    const results = [];
    const errors = [];
    let successCount = 0;

    fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        // Basic validation
                        if (!row.title || !row.mrp) {
                            errors.push({ row: i + 1, message: 'Missing required fields (title, mrp)' });
                            continue;
                        }

                        // Check if product exists by part_number or title
                        let product = null;
                        if (row.part_number) {
                            product = await Product.findOne({ part_number: row.part_number });
                        } else {
                            product = await Product.findOne({ title: row.title });
                        }

                        const productData = {
                            title: row.title,
                            slug: row.slug || row.title.toLowerCase().split(' ').join('-').replace(/[^a-z0-9-]/g, ''),
                            subtitle: row.subtitle,
                            part_number: row.part_number,
                            mrp: Number(row.mrp),
                            basePrice: Number(row.mrp),
                            selling_price_a: Number(row.selling_price_a || row.mrp),
                            discountedPrice: Number(row.selling_price_a || row.mrp),
                            selling_price_b: row.selling_price_b ? Number(row.selling_price_b) : undefined,
                            selling_price_c: row.selling_price_c ? Number(row.selling_price_c) : undefined,
                            opening_stock: Number(row.stock || 0),
                            stock: Number(row.stock || 0),
                            description: row.description,
                            deliveryTime: row.delivery_time || '3-5 business days',
                            returnWindow: row.return_window ? Number(row.return_window) : 7,
                            meta_title: row.meta_title,
                            meta_description: row.meta_description,
                            keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : undefined,
                            isActive: true,
                            isVisible: true
                        };

                        // Handle Images
                        const images = [];
                        if (row.featured_image_url) {
                            productData.featured_image = row.featured_image_url;
                            images.push({ url: row.featured_image_url, isMain: true });
                        }

                        if (row.gallery_image_urls) {
                            const gallery = row.gallery_image_urls.split(',').map(u => u.trim()).filter(Boolean);
                            productData.gallery_images = gallery;
                            gallery.forEach(url => {
                                images.push({ url, isMain: false });
                            });
                        }

                        if (images.length > 0) productData.images = images;

                        if (row.gst_rate) productData.gst_rate = Number(row.gst_rate);

                        // Look up HSN Code
                        if (row.hsn_code) {
                            const hsn = await HSNCode.findOne({ hsn_code: row.hsn_code });
                            if (hsn) {
                                productData.hsn_code = hsn._id;
                                if (!productData.gst_rate) productData.gst_rate = hsn.gst_rate;
                            }
                        }

                        // Look up Category and Brand if names are provided
                        if (row.category_name) {
                            const cat = await Category.findOne({ name: new RegExp(`^${row.category_name}$`, 'i') });
                            if (cat) productData.category = cat._id;
                        }

                        if (row.brand_name) {
                            const brand = await Brand.findOne({ name: new RegExp(`^${row.brand_name}$`, 'i') });
                            if (brand) productData.brand = brand._id;
                        }

                        // Look up SubCategories (comma separated)
                        if (row.sub_category_names) {
                            const subCatNames = row.sub_category_names.split(',').map(s => s.trim()).filter(Boolean);
                            const subCats = await SubCategory.find({ name: { $in: subCatNames.map(name => new RegExp(`^${name}$`, 'i')) } });
                            if (subCats.length > 0) productData.sub_category = subCats.map(sc => sc._id);
                        }

                        let savedProduct;
                        if (product) {
                            // Update existing
                            Object.assign(product, productData);
                            savedProduct = await product.save();
                        } else {
                            // Create new
                            if (!productData.category) {
                                errors.push({ row: i + 1, message: 'Category not found or invalid' });
                                continue;
                            }
                            const newProduct = new Product(productData);
                            savedProduct = await newProduct.save();
                        }

                        // Sync to Tally if enabled
                        try {
                            const settings = await SystemSettings.findById('system_settings');
                            if (settings && settings.tallyIntegrationEnabled) {
                                await tallyService.syncWithHealthCheck({
                                    xmlData: generateStockItemXML(savedProduct),
                                    type: 'Product',
                                    relatedId: savedProduct._id,
                                    relatedModel: 'Product'
                                });
                            }
                        } catch (tallyErr) {
                            console.error(`Tally Sync Failed for product ${savedProduct.title}:`, tallyErr.message);
                            // We don't fail the import because Tally sync failed, it's just a background task
                        }

                        successCount++;
                    } catch (err) {
                        errors.push({ row: i + 1, message: err.message });
                    }
                }

                // Cleanup file
                deleteFile(file.path);

                await logAction({ action: 'BULK_IMPORT_PRODUCTS', req, details: { count: successCount, error_count: errors.length } });

                res.json({
                    success: true,
                    message: `Import completed. ${successCount} products processed.`,
                    errors: errors.length > 0 ? errors : undefined
                });
            } catch (err) {
                console.error('Bulk import error:', err);
                res.status(500).json({ message: 'Error processing CSV', error: err.message });
            }
        });
};

// @desc    Export Products
// @route   GET /api/admin/products/export
// @access  Admin
exports.exportProducts = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const category = req.query.category;
        const sub_category = req.query.sub_category;

        let query = {};
        if (status === 'active') query.isActive = { $ne: false };
        else if (status === 'inactive') query.isActive = false;

        if (category) query.category = category;
        if (sub_category) query.sub_category = sub_category;

        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            const brands = await Brand.find({ name: searchRegex }).select('_id');
            const categories = await Category.find({ name: searchRegex }).select('_id');
            const brandIds = brands.map(b => b._id);
            const categoryIds = categories.map(c => c._id);
            query.$or = [
                { title: searchRegex },
                { slug: searchRegex },
                { part_number: searchRegex },
                { 'variations.sku': searchRegex },
                { 'models.variations.sku': searchRegex },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } }
            ];
        }

        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('sub_category', 'name')
            .populate('brand', 'name')
            .sort({ createdAt: -1 });

        const data = products.map(p => ({
            ID: p._id.toString(),
            Title: p.title?.en || (typeof p.title === 'string' ? p.title : ''),
            Slug: p.slug,
            PartNumber: p.part_number || '',
            Category: p.category?.name || '',
            SubCategory: p.sub_category?.map(sc => sc.name).join(', ') || '',
            Brand: p.brand?.name || '',
            MRP: p.mrp,
            PriceA: p.selling_price_a,
            PriceB: p.selling_price_b,
            PriceC: p.selling_price_c,
            Stock: p.opening_stock,
            Status: p.isActive ? 'Active' : 'Inactive'
        }));

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');
            worksheet.columns = [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Title', key: 'Title', width: 40 },
                { header: 'Slug', key: 'Slug', width: 30 },
                { header: 'Part Number', key: 'PartNumber', width: 15 },
                { header: 'Category', key: 'Category', width: 20 },
                { header: 'Sub Category', key: 'SubCategory', width: 20 },
                { header: 'Brand', key: 'Brand', width: 20 },
                { header: 'MRP', key: 'MRP', width: 10 },
                { header: 'Price A', key: 'PriceA', width: 10 },
                { header: 'Price B', key: 'PriceB', width: 10 },
                { header: 'Price C', key: 'PriceC', width: 10 },
                { header: 'Stock', key: 'Stock', width: 10 },
                { header: 'Status', key: 'Status', width: 10 }
            ];
            worksheet.addRows(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
            return workbook.xlsx.write(res).then(() => res.status(200).end());
        } else {
            const fields = ['ID', 'Title', 'Slug', 'PartNumber', 'Category', 'SubCategory', 'Brand', 'MRP', 'PriceA', 'PriceB', 'PriceC', 'Stock', 'Status'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
            return res.status(200).send(csv);
        }
    } catch (error) {
        console.error('Export products error:', error);
        res.status(500).json({ message: 'Failed to export products', error: error.message });
    }
};

// @desc    Download Bulk Import Sample CSV
// @route   GET /api/admin/products/import-sample
// @access  Admin
exports.getImportSample = async (req, res) => {
    try {
        const headers = [
            'title', 'mrp', 'selling_price_a', 'selling_price_b', 'selling_price_c',
            'stock', 'part_number', 'category_name', 'sub_category_names', 'brand_name',
            'hsn_code', 'gst_rate', 'delivery_time', 'return_window', 'featured_image_url',
            'gallery_image_urls', 'meta_title', 'meta_description', 'keywords', 'description'
        ];

        const data = [
            {
                title: 'Sample Tool',
                mrp: 1000,
                selling_price_a: 850,
                selling_price_b: 800,
                selling_price_c: 750,
                stock: 50,
                part_number: 'T001',
                category_name: 'Power Tools',
                sub_category_names: 'Drills, Handheld',
                brand_name: 'Bosch',
                hsn_code: '8467',
                gst_rate: 18,
                delivery_time: '3-5 Days',
                return_window: 7,
                featured_image_url: 'https://placehold.co/600x400',
                gallery_image_urls: 'https://placehold.co/600x400,https://placehold.co/600x400',
                meta_title: 'Best Drill',
                meta_description: 'High quality drill for pros',
                keywords: 'tool, drill, bosch',
                description: 'A high quality power tool'
            }
        ];

        const json2csvParser = new Parser({ fields: headers });
        const csv = json2csvParser.parse(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=product_import_sample.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate sample', error: error.message });
    }
};
