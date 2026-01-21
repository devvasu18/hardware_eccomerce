const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    basePrice: { type: Number, required: true }, // Original Price (Striked)
    discountedPrice: { type: Number, required: true }, // Active Selling Price
    // wholesalePrice field removed
    stock: { type: Number, default: 0 },
    category: { type: String },
    imageUrl: { type: String }, // Primary product image (base64 or URL)
    images: [{ type: String }],

    // On-Demand Logic
    isOnDemand: { type: Boolean, default: false }, // If true, stock is irrelevant, user requests it
    isVisible: { type: Boolean, default: true },

    // Homepage Display Categories
    isFeatured: { type: Boolean, default: false }, // Mark product as featured for homepage
    isTopSale: { type: Boolean, default: false }, // Mark product as top selling item
    isDailyOffer: { type: Boolean, default: false }, // Mark product as daily offer/deal
    isNewArrival: { type: Boolean, default: false }, // Mark product as new arrival

    // Dynamic Pricing/Config
    // Dynamic Pricing/Config
    hsnCode: { type: String, required: true },
    gstRate: { type: Number, default: 18 }, // Combined GST
    cgst: { type: Number, default: 9 },
    sgst: { type: Number, default: 9 },
    igst: { type: Number, default: 18 },

    // Technical Data
    specifications: { type: Map, of: String }, // e.g., { "Material": "Steel", "Diameter": "10mm" }
    compatibilityTags: [{ type: String }],
    unit: { type: String, default: 'piece' }, // kg, set, meter
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
