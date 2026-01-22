const HSNCode = require('../models/HSNCode');
const Offer = require('../models/Offer');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, (err) => {
        if (err) console.error(`Failed to delete file: ${fullPath}`, err);
    });
};

// --- HSN Codes ---
exports.getHSNs = async (req, res) => {
    try {
        const hsns = await HSNCode.find().sort({ createdAt: -1 });
        res.json(hsns);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createHSN = async (req, res) => {
    try {
        const hsn = await HSNCode.create(req.body);
        res.status(201).json(hsn);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateHSN = async (req, res) => {
    try {
        const hsn = await HSNCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(hsn);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteHSN = async (req, res) => {
    try {
        await HSNCode.findByIdAndDelete(req.params.id);
        res.json({ message: 'HSN Code deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- Offers ---
exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createOffer = async (req, res) => {
    try {
        const { title, slug, percentage } = req.body;
        const banner_image = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const offer = await Offer.create({ title, slug, percentage, banner_image });
        res.status(201).json(offer);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (offer) {
            deleteFile(offer.banner_image);
            await offer.deleteOne();
        }
        res.json({ message: 'Offer deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- Categories ---
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ displayOrder: 1 });
        res.json(categories);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, displayOrder } = req.body;
        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const category = await Category.create({ name, slug, description, displayOrder, image });
        res.status(201).json(category);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // Cascading Delete
        // 1. Delete SubCategories
        const subCats = await SubCategory.find({ category_id: category._id });
        subCats.forEach(sc => deleteFile(sc.image));
        await SubCategory.deleteMany({ category_id: category._id });

        // 2. Delete/Archive Products (Here we delete)
        const products = await Product.find({ category: category._id });
        // NOTE: This might be heavy if lots of products. Ideally using a background job or just flagging.
        // For now, simple loop delete to ensure image cleanup
        for (const prod of products) {
            deleteFile(prod.featured_image);
            deleteFile(prod.featured_image_2);
            // ... delete other images
            await prod.deleteOne();
        }

        deleteFile(category.image);
        await category.deleteOne();

        res.json({ message: 'Category and related data deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- Sub-Categories ---
exports.getSubCategories = async (req, res) => {
    try {
        // Support filtering by category_id via query
        const query = req.query.category_id ? { category_id: req.query.category_id } : {};
        const subCategories = await SubCategory.find(query).populate('category_id', 'name');
        res.json(subCategories);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createSubCategory = async (req, res) => {
    try {
        const { category_id, name, slug } = req.body;
        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const subCategory = await SubCategory.create({ category_id, name, slug, image });
        res.status(201).json(subCategory);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);
        if (subCategory) {
            deleteFile(subCategory.image);
            await subCategory.deleteOne();
            // Optional: Handle products that have this subcategory?
        }
        res.json({ message: 'SubCategory deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- Brands ---
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.json(brands);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createBrand = async (req, res) => {
    try {
        const { name, slug, categories } = req.body;
        const logo_image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        let parsedCats = categories;
        if (typeof categories === 'string') parsedCats = [categories];

        const brand = await Brand.create({ name, slug, logo_image, categories: parsedCats });
        res.status(201).json(brand);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (brand) {
            deleteFile(brand.logo_image);
            await brand.deleteOne();
        }
        res.json({ message: 'Brand deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- Stats ---
exports.getStats = async (req, res) => {
    try {
        const [products, categories, users, orders] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            // Assuming User and Order models exist
            // mongoose.model('User').countDocuments(),
            // mongoose.model('Order').countDocuments()
            Promise.resolve(0), Promise.resolve(0) // Placeholders
        ]);
        res.json({ products, categories, users, orders });
    } catch (error) { res.status(500).json({ error: error.message }); }
}
