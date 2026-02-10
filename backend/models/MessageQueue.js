const mongoose = require('mongoose');

const messageQueueSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true
    },
    messageBody: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed'],
        default: 'pending'
    },
    sessionId: {
        type: String,
        default: 'default'
    },
    attempts: {
        type: Number,
        default: 0
    },
    rawResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    error: String,
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    lastAttemptAt: Date,
    failedAt: Date
}, { timestamps: true });

// Index for getting pending messages sorted by time
messageQueueSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('MessageQueue', messageQueueSchema);
