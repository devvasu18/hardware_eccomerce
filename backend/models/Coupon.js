const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String // Optional URL path
    },
    discount_type: {
        type: String,
        enum: ['Percentage', 'Fixed Amount'],
        required: true
    },
    discount_value: {
        type: Number,
        required: true,
        min: 0
    },
    max_discount_amount: {
        type: Number, // Only relevant if type is Percentage
        default: 0
    },
    min_cart_value: {
        type: Number,
        default: 0
    },
    usage_limit: {
        type: Number, // 0 or null could mean unlimited
        default: 0
    },
    usage_count: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    },
    expiry_date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
