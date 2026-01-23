const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },

    status: {
        type: String,
        required: true,
        enum: ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered', 'Cancelled']
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // Changed to false to allow system-generated logs
    },

    updatedByName: {
        type: String,
        required: true
    },

    updatedByRole: {
        type: String,
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },

    notes: {
        type: String,
        trim: true
    },

    // For system-generated logs
    isSystemGenerated: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// Indexes for efficient queries
statusLogSchema.index({ order: 1, timestamp: -1 });
statusLogSchema.index({ status: 1 });

module.exports = mongoose.model('StatusLog', statusLogSchema);
