const mongoose = require('mongoose');

const tallySyncQueueSchema = new mongoose.Schema({
    payload: {
        type: String,
        required: true
    },
    payloadHash: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['Order', 'StockEntry', 'OnDemand', 'Customer', 'Product', 'Other'], // Mapped to Entity Type
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String (e.g. LEDGER-CGST)
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
    isOnDemand: {
        type: Boolean,
        default: false
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

tallySyncQueueSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

tallySyncQueueSchema.index({ status: 1, createdAt: 1 }); // FIFO
tallySyncQueueSchema.index({ relatedId: 1, relatedModel: 1 });
tallySyncQueueSchema.index({ payloadHash: 1 }, { unique: true });

module.exports = mongoose.model('TallySyncQueue', tallySyncQueueSchema);
