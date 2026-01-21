const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        priceAtBooking: { type: Number, required: true },
        gstRate: { type: Number },
        cgst: { type: Number },
        sgst: { type: Number },
        igst: { type: Number }, // If interstate
        totalWithTax: { type: Number }
    }],
    totalAmount: { type: Number, required: true },
    taxTotal: { type: Number },

    // Invoicing
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceDate: { type: Date },
    shippingAddress: { type: String },
    billingAddress: { type: String },

    status: {
        type: String,
        enum: ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered', 'Cancelled', 'Request Pending', 'Request Approved'],
        default: 'Order Placed'
    },

    // Logistics (Bus System)
    busDetails: {
        busNumber: { type: String },
        driverContact: { type: String },
        departureTime: { type: Date },
        expectedArrival: { type: Date },
        dispatchDate: { type: Date },
        busPhoto: { type: String }, // URL to uploaded image
    },

    logisticsUpdates: [{
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
        timestamp: { type: Date, default: Date.now },
        proofImage: String
    }],

    // Tally Integration
    tallyStatus: {
        type: String,
        enum: ['pending', 'saved', 'failed', 'queued'],
        default: 'pending'
    },
    tallyVoucherNumber: { type: String },
    tallyErrorLog: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
