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
        productTitle: { type: String }, // Snapshot for history
        productImage: { type: String }, // Snapshot for history
        quantity: { type: Number, required: true },
        quantityReturned: { type: Number, default: 0 }, // Track partial returns
        priceAtBooking: { type: Number, required: true },
        variationId: { type: mongoose.Schema.Types.ObjectId },
        variationText: { type: String }, // Stored snapshot: "Color: Red"
        modelId: { type: mongoose.Schema.Types.ObjectId },
        modelName: { type: String },
        gstRate: { type: Number },
        sgst: { type: Number },
        igst: { type: Number }, // If interstate
        totalWithTax: { type: Number },
        status: {
            type: String,
            enum: ['Active', 'Cancelled', 'Returned', 'Refunded'],
            default: 'Active'
        },
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcurementRequest' } // Link to original request
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
        enum: ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered', 'Cancelled'],
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
        notes: { type: String },
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

    // Notification Tracking
    notifications: {
        orderConfirmationSent: { type: Boolean, default: false },
        orderConfirmationSentAt: { type: Date },
        shipmentDispatchSent: { type: Boolean, default: false },
        shipmentDispatchSentAt: { type: Date },
        notificationErrors: [{
            type: { type: String }, // 'email' or 'whatsapp'
            error: String,
            timestamp: { type: Date, default: Date.now }
        }]
    }

}, { timestamps: true });

// Indexes for high-performance order lookups
orderSchema.index({ user: 1 }); // Searching orders by user
orderSchema.index({ status: 1 }); // Filtering by status
orderSchema.index({ paymentStatus: 1 }); // Filtering by payment
orderSchema.index({ createdAt: -1 }); // Sorting by date (Newest first)
orderSchema.index({ invoiceNumber: 1 }); // Quick lookup by invoice

module.exports = mongoose.model('Order', orderSchema);
