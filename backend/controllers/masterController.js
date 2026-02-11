const HSNCode = require('../models/HSNCode');
const Offer = require('../models/Offer');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { deleteFile } = require('../utils/fileHandler');
const { logAction } = require('../utils/auditLogger');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

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
        await logAction({ action: 'CREATE_HSN', req, targetResource: 'HSNCode', targetId: hsn._id, details: req.body });
        res.status(201).json(hsn);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateHSN = async (req, res) => {
    try {
        const hsn = await HSNCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logAction({ action: 'UPDATE_HSN', req, targetResource: 'HSNCode', targetId: req.params.id, details: req.body });
        res.json(hsn);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteHSN = async (req, res) => {
    try {
        await HSNCode.findByIdAndDelete(req.params.id);
        await logAction({ action: 'DELETE_HSN', req, targetResource: 'HSNCode', targetId: req.params.id });
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
        const { name, slug, description, displayOrder, showInNav } = req.body;
        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (showInNav) {
            const count = await Category.countDocuments({ showInNav: true });
            if (count >= 10) {
                return res.status(400).json({ message: 'Navigation limit reached (max 10). Uncheck "Show in Navigation".' });
            }
        }

        const category = await Category.create({ name, slug, description, displayOrder, image, showInNav });
        await logAction({ action: 'CREATE_CATEGORY', req, targetResource: 'Category', targetId: category._id, details: { name, slug, displayOrder, showInNav } });
        res.status(201).json(category);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, slug, description, displayOrder, showInNav, isActive } = req.body;
        const updateData = { name, slug, description, displayOrder, showInNav, isActive };

        // Handle showInNav check (handling both boolean and string "true" from multipart)
        const isShowInNav = showInNav === true || showInNav === 'true';

        if (isShowInNav) {
            const count = await Category.countDocuments({ showInNav: true, _id: { $ne: req.params.id } });
            if (count >= 10) {
                return res.status(400).json({ message: 'Navigation limit reached (max 10). Uncheck "Show in Navigation".' });
            }
        }

        // Handle Image Update
        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, '/');
            // Delete old image
            const oldCategory = await Category.findById(req.params.id);
            if (oldCategory && oldCategory.image) {
                deleteFile(oldCategory.image);
            }
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) return res.status(404).json({ message: 'Category not found' });

        await logAction({ action: 'UPDATE_CATEGORY', req, targetResource: 'Category', targetId: category._id, details: { name, slug } });
        res.json(category);
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

        // 2. Delete/Archive Products (Safety Guard)
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 50) {
            return res.status(400).json({
                message: `Safety Block: This category has ${productCount} products. Direct deletion is blocked to prevent accidental data loss. Please move or delete products individually first.`
            });
        }

        const products = await Product.find({ category: category._id });
        for (const prod of products) {
            deleteFile(prod.featured_image);
            deleteFile(prod.featured_image_2);
            // Delete gallery images too if they exist
            if (prod.gallery_images && Array.isArray(prod.gallery_images)) {
                prod.gallery_images.forEach(img => deleteFile(img));
            }
            await prod.deleteOne();
        }

        deleteFile(category.image);
        await category.deleteOne();

        // Audit Log
        await logAction({ action: 'DELETE_CATEGORY', req, targetResource: 'Category', targetId: req.params.id, details: { name: category.name } });

        res.json({ message: 'Category and related data deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.reorderCategories = async (req, res) => {
    try {
        const { order } = req.body; // Array of { id, position }

        if (!Array.isArray(order)) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        const bulkOps = order.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { displayOrder: item.position }
            }
        }));

        await Category.bulkWrite(bulkOps);

        await logAction({
            action: 'REORDER_CATEGORIES',
            req,
            targetResource: 'Category',
            details: { count: order.length }
        });

        res.json({ message: 'Categories reordered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

exports.updateSubCategory = async (req, res) => {
    try {
        const { category_id, name, slug } = req.body;
        const updateData = { category_id, name, slug };

        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, '/');
            // Delete old image
            const oldSubCat = await SubCategory.findById(req.params.id);
            if (oldSubCat && oldSubCat.image) {
                deleteFile(oldSubCat.image);
            }
        }

        const subCategory = await SubCategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(subCategory);
    } catch (error) { res.status(400).json({ error: error.message }); }
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
    // Lazy load models if not at top, or just use mongoose.model
    const Order = require('../models/Order');
    const ProcurementRequest = require('../models/ProcurementRequest');

    try {
        const [pendingOrders, onDemandRequests] = await Promise.all([
            Order.countDocuments({ status: 'Order Placed' }),
            ProcurementRequest.countDocuments({ status: 'Pending' })
        ]);

        res.json({
            pendingOrders,
            onDemandRequests,
            tallyFailures: 0 // Placeholder logic for now
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
}

exports.exportCategories = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const categories = await Category.find().sort({ displayOrder: 1 });

        const data = categories.map(c => ({
            ID: c._id.toString(),
            Name: c.name,
            Slug: c.slug,
            Description: c.description || '',
            DisplayOrder: c.displayOrder || 0,
            ShowInNav: c.showInNav ? 'Yes' : 'No',
            Status: c.isActive !== false ? 'Active' : 'Inactive'
        }));

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Categories');
            worksheet.columns = [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Name', key: 'Name', width: 25 },
                { header: 'Slug', key: 'Slug', width: 25 },
                { header: 'Description', key: 'Description', width: 40 },
                { header: 'Display Order', key: 'DisplayOrder', width: 15 },
                { header: 'Show In Nav', key: 'ShowInNav', width: 15 },
                { header: 'Status', key: 'Status', width: 15 }
            ];
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');
            return workbook.xlsx.write(res).then(() => res.status(200).end());
        } else {
            const fields = ['ID', 'Name', 'Slug', 'Description', 'DisplayOrder', 'ShowInNav', 'Status'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=categories.csv');
            return res.status(200).send(csv);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportSubCategories = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const subCategories = await SubCategory.find().populate('category_id', 'name');

        const data = subCategories.map(sc => ({
            ID: sc._id.toString(),
            Category: sc.category_id?.name || 'N/A',
            Name: sc.name,
            Slug: sc.slug
        }));

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('SubCategories');
            worksheet.columns = [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Parent Category', key: 'Category', width: 25 },
                { header: 'Name', key: 'Name', width: 25 },
                { header: 'Slug', key: 'Slug', width: 25 }
            ];
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=sub_categories.xlsx');
            return workbook.xlsx.write(res).then(() => res.status(200).end());
        } else {
            const fields = ['ID', 'Category', 'Name', 'Slug'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=sub_categories.csv');
            return res.status(200).send(csv);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
