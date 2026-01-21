const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if guest, but preferred logged in
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    requestedQuantity: { type: Number, required: true },
    currentStockAtRequest: { type: Number }, // Snapshot

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
        mobile: String // Critical for guests
    }

}, { timestamps: true });

module.exports = mongoose.model('ProcurementRequest', requestSchema);
