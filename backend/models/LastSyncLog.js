const mongoose = require('mongoose');

const lastSyncLogSchema = new mongoose.Schema({
    syncType: {
        type: String,
        enum: ['STOCK', 'VOUCHER', 'MASTER'],
        required: true,
        unique: true
    },
    lastSuccessfulSyncAt: {
        type: Date,
        required: true
    },
    checksum: {
        type: String, // Optional, for data integrity verification
        default: null
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
        default: 'SUCCESS'
    },
    itemsProcessed: {
        type: Number,
        default: 0
    },
    errorLog: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('LastSyncLog', lastSyncLogSchema);
