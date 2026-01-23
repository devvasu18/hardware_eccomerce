const Coupon = require('../models/Coupon');
const fs = require('fs');
const path = require('path');

// Helper to delete file
const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, (err) => {
        if (err) console.error(`Failed to delete file: ${fullPath}`, err);
    });
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
    }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Admin
exports.createCoupon = async (req, res) => {
    try {
        const { code, description, discount_type, discount_value, max_discount_amount, min_cart_value, usage_limit, status } = req.body;

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            image,
            discount_type,
            discount_value,
            max_discount_amount: max_discount_amount || 0,
            min_cart_value: min_cart_value || 0,
            usage_limit: usage_limit || 0,
            status: status === 'true' || status === true
        });

        res.status(201).json(coupon);
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(400).json({ message: 'Failed to create coupon', error: error.message });
    }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Admin
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

        const { code, description, discount_type, discount_value, max_discount_amount, min_cart_value, usage_limit, status } = req.body;

        if (code) coupon.code = code.toUpperCase();
        if (description) coupon.description = description;
        if (discount_type) coupon.discount_type = discount_type;
        if (discount_value !== undefined) coupon.discount_value = discount_value;
        if (max_discount_amount !== undefined) coupon.max_discount_amount = max_discount_amount;
        if (min_cart_value !== undefined) coupon.min_cart_value = min_cart_value;
        if (usage_limit !== undefined) coupon.usage_limit = usage_limit;
        if (status !== undefined) coupon.status = status;

        if (req.file) {
            if (coupon.image) deleteFile(coupon.image);
            coupon.image = req.file.path.replace(/\\/g, '/');
        }

        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(400).json({ message: 'Failed to update coupon', error: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

        if (coupon.image) deleteFile(coupon.image);
        await coupon.deleteOne();

        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete coupon', error: error.message });
    }
};
