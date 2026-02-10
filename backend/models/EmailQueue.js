const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    html: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed'],
        default: 'pending'
    },
    attempts: {
        type: Number,
        default: 0
    },
    error: String,
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    lastAttemptAt: Date,
    failedAt: Date,
    rawResponse: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Index for performance
emailQueueSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
