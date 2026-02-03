const mongoose = require('mongoose');

const tallySyncQueueSchema = new mongoose.Schema({
    payload: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['SalesVoucher', 'PurchaseVoucher', 'Ledger', 'StockItem', 'Other'],
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    relatedModel: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'synced', 'failed'],
        default: 'pending'
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 5
    },
    lastError: {
        type: String,
        default: null
    },
    tallyResponse: {
        type: String,
        default: null
    },
    syncedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

tallySyncQueueSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

tallySyncQueueSchema.index({ status: 1, createdAt: -1 });
tallySyncQueueSchema.index({ relatedId: 1, relatedModel: 1 });

module.exports = mongoose.model('TallySyncQueue', tallySyncQueueSchema);
