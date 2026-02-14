const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
    }
};

// @desc    Get single coupon by ID
// @route   GET /api/coupons/:id
// @access  Admin/Public(validated)
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupon', error: error.message });
    }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Admin
exports.createCoupon = async (req, res) => {
    try {
        const { code, description, discount_type, discount_value, max_discount_amount, min_cart_value, usage_limit, status, expiry_date } = req.body;

        if (!code || !description || !discount_type || discount_value === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        // Handle Image from Cloudinary
        const image = req.file ? req.file.path : null;

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            image,
            discount_type,
            discount_value: Number(discount_value),
            max_discount_amount: Number(max_discount_amount) || 0,
            min_cart_value: Number(min_cart_value) || 0,
            usage_limit: Number(usage_limit) || 0,
            status: status === 'true' || status === true,
            expiry_date: expiry_date || null
        });

        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(400).json({
            success: false,
            message: error.name === 'ValidationError' ? 'Validation Failed' : 'Failed to create coupon',
            error: error.message
        });
    }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Admin
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        const { code, description, discount_type, discount_value, max_discount_amount, min_cart_value, usage_limit, status, expiry_date } = req.body;

        if (code) coupon.code = code.toUpperCase();
        if (description) coupon.description = description;
        if (discount_type) coupon.discount_type = discount_type;
        if (discount_value !== undefined) coupon.discount_value = Number(discount_value);
        if (max_discount_amount !== undefined) coupon.max_discount_amount = Number(max_discount_amount);
        if (min_cart_value !== undefined) coupon.min_cart_value = Number(min_cart_value);
        if (usage_limit !== undefined) coupon.usage_limit = Number(usage_limit);
        if (status !== undefined) coupon.status = (status === 'true' || status === true);
        if (expiry_date !== undefined) coupon.expiry_date = expiry_date || null;

        if (req.file) {
            coupon.image = req.file.path;
        }

        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to update coupon', error: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        await coupon.deleteOne();
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
    }
};

// @desc    Validate/Apply coupon
// @route   POST /api/coupons/validate
// @access  Public/Private
exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: true });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
        }

        // Check Expiry Date
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        // Check Minimum Cart Value
        if (Number(cartTotal) < coupon.min_cart_value) {
            return res.status(400).json({
                success: false,
                message: `Minimum cart value of ₹${coupon.min_cart_value} is required to use this coupon`
            });
        }

        // Check Usage Limit
        if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        // Calculate Discount Amount
        let discount = 0;
        if (coupon.discount_type === 'Percentage') {
            discount = Math.round((Number(cartTotal) * coupon.discount_value) / 100);
            if (coupon.max_discount_amount > 0 && discount > coupon.max_discount_amount) {
                discount = coupon.max_discount_amount;
            }
        } else {
            discount = coupon.discount_value;
        }

        // Ensure discount doesn't exceed cart total
        if (discount > Number(cartTotal)) discount = Number(cartTotal);

        res.json({
            success: true,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                description: coupon.description
            },
            discountAmount: discount
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to validate coupon', error: error.message });
    }
};
