const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // User reference - optional for guest orders
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest orders
    },

    // Guest customer details (for non-logged-in users)
    guestCustomer: {
        name: { type: String },
        phone: { type: String },
        email: { type: String },
        address: { type: String }
    },

    // Flag to identify order type
    isGuestOrder: {
        type: Boolean,
        default: false
    },

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        priceAtBooking: { type: Number, required: true },
        size: { type: String }, // Product size variant if applicable
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
    shippingAddress: { type: String, required: true },
    billingAddress: { type: String },

    // Payment
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'COD'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online', 'UPI', 'Card', 'NetBanking'],
        default: 'COD'
    },

    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Request Pending', 'Request Approved'],
        default: 'Pending'
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
