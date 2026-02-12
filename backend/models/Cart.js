const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    mrp: {
        type: Number // Store MRP for discount calculation display
    },
    variationId: {
        type: mongoose.Schema.Types.ObjectId
    },
    variationText: {
        type: String // e.g. "Color: Red, Size: XL" snapshot for UI
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId
    },
    modelName: {
        type: String
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcurementRequest'
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    items: [cartItemSchema],
    lastModified: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Update lastModified on any change
// Update lastModified on any change is handled by timestamps: true
// cartSchema.pre('save') removed to prevent middleware errors

// Calculate cart total (virtual field)
cartSchema.virtual('total').get(function () {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Calculate total items count
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
