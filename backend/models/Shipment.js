const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },

    // Bus Details
    busNumber: {
        type: String,
        required: true,
        trim: true
    },

    busPhotoUrl: {
        type: String,
        required: true
    },

    driverContact: {
        type: String,
        required: true,
        trim: true
    },

    // Timing Details
    departureTime: {
        type: Date,
        required: true
    },

    expectedArrival: {
        type: Date,
        required: true
    },

    dispatchDate: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Live Status
    liveStatus: {
        type: String,
        enum: ['Preparing', 'On the way', 'Arrived at destination', 'Out for delivery', 'Delivered'],
        default: 'Preparing'
    },

    // Additional tracking info
    currentLocation: {
        type: String,
        trim: true
    },

    estimatedDeliveryDate: {
        type: Date
    },

    actualDeliveryDate: {
        type: Date
    },

    // Admin who created/updated
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Notes
    notes: {
        type: String,
        trim: true
    }

}, { timestamps: true });

// Index for faster queries
shipmentSchema.index({ order: 1 });
shipmentSchema.index({ busNumber: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
