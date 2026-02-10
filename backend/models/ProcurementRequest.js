const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if guest, but preferred logged in
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    requestedQuantity: { type: Number, required: true },
    currentStockAtRequest: { type: Number }, // Snapshot
    declaredBasePrice: { type: Number }, // Price seen by customer at time of request

    // Configuration
    modelId: { type: mongoose.Schema.Types.ObjectId },
    variationId: { type: mongoose.Schema.Types.ObjectId },
    modelName: { type: String },
    variationText: { type: String },

    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Converted to Order'],
        default: 'Pending'
    },

    // Admin Response
    adminResponse: {
        priceOffered: { type: Number },
        expectedDelivery: { type: Date },
        adminNote: { type: String }
    },

    customerContact: {
        name: String,
        mobile: String, // Critical for guests
        address: String
    },

    // Tally Sync Status
    tallyStatus: {
        type: String,
        enum: ['pending', 'queued', 'saved', 'failed'],
        default: 'pending'
    },
    tallyErrorLog: { type: String, default: '' },
    tallyVoucherId: { type: String } // Optional: Store Tally's Voucher ID/Reference

}, { timestamps: true });

module.exports = mongoose.model('ProcurementRequest', requestSchema);
