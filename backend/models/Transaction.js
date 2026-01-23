const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true // Idempotency key
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Stripe', 'Razorpay', 'PayPal', 'Wallet', 'NetBanking', 'UPI'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending', 'Refunded'],
        default: 'Pending'
    },
    gatewayResponse: {
        type: Object // Store full JSON payload
    }
}, { timestamps: true });

// Index for easier searching
transactionSchema.index({ paymentId: 1 });
transactionSchema.index({ order: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
