const mongoose = require('mongoose');

const productStockSchema = new mongoose.Schema({
    stock_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockEntry',
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    party_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    stock_type: {
        type: String,
        enum: ['in', 'out'],
        default: 'in'
    },
    qty: {
        type: Number,
        required: true
    },
    unit_price: {
        type: Number,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ProductStock', productStockSchema);
