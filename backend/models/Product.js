const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Core Info
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subtitle: { type: String },
    part_number: { type: String },

    // Relationships
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    sub_category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }], // Single product can have multiple sub-categories
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },

    // HSN & Tax
    hsn_code: { type: mongoose.Schema.Types.ObjectId, ref: 'HSNCode' }, // Link to master
    gst_rate: { type: Number }, // Percentage (auto-fetched or overridden)

    // Description
    description: { type: String }, // Rich Text
    specifications: { type: Map, of: String }, // JSON key-value pairs

    // Pricing
    mrp: { type: Number, required: true },
    selling_price_a: { type: Number }, // Standard
    selling_price_b: { type: Number }, // Wholesale
    selling_price_c: { type: Number }, // Special
    delivery_charge: { type: Number, default: 0 },

    // Inventory
    opening_stock: { type: Number, default: 0 },
    opening_price: { type: Number }, // Cost price
    max_unit_buy: { type: Number },
    product_quantity: { type: String }, // Pack size e.g. "1 Pc"
    low_stock_threshold: { type: Number, default: 5 },

    // Variants
    color_name: { type: String },
    color_hex: { type: String },
    other_color_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    size: { type: String },

    // Media
    featured_image: { type: String }, // Main thumbnail
    featured_image_2: { type: String }, // Hover/Second view
    // gallery_images: [{ type: String }],
    gallery_images: { type: [String], default: [] },
    size_chart: { type: String },

    // SEO
    meta_title: { type: String },
    meta_description: { type: String },
    keywords: [{ type: String }],

    // Status & Flags
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    // Models & Variants System (Enhanced)
    models: [{
        name: { type: String, required: true }, // e.g. "Pro Max"
        mrp: { type: Number }, // Base MRP for this model
        selling_price_a: { type: Number }, // Base Selling Price for this model
        featured_image: { type: String }, // Primary image for this model
        gallery_images: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
        variations: [{
            type: { type: String, enum: ['Color', 'Size', 'Weight', 'Volume', 'Pack', 'Battery', 'Range', 'Storage', 'Other'], required: true },
            value: { type: String, required: true },
            price: { type: Number, required: true }, // Absolute price for this selection
            mrp: { type: Number },
            stock: { type: Number, default: 0 },
            sku: { type: String },
            image: { type: String },
            isActive: { type: Boolean, default: true }
        }]
    }],

    // Legacy Variations (Still kept for non-model products)
    variations: [{
        type: { type: String, enum: ['Color', 'Size', 'Weight', 'Volume', 'Pack', 'Battery', 'Range', 'Storage', 'Other'], required: true },
        value: { type: String, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number },
        stock: { type: Number, default: 0 },
        sku: { type: String },
        image: { type: String },
        isActive: { type: Boolean, default: true }
    }],

    // Legacy / Compatibility
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTopSale: { type: Boolean, default: false },
    isDailyOffer: { type: Boolean, default: false },
    isOnDemand: { type: Boolean, default: false }, // Made-to-order products that never show as out of stock

    // Legacy / Compatibility
    stock: { type: Number, default: 0 },
    price: { type: Number },
    basePrice: { type: Number }, // Alias for MRP often used
    discountedPrice: { type: Number }, // Alias for Selling Price

}, { timestamps: true });

// Indexes for Filtering & Search
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isOnDemand: 1 });
// Text index for search (title & description)
productSchema.index({ title: 'text', description: 'text', part_number: 'text', 'variations.value': 'text' });

// SKU uniqueness constraints (sparse to allow empty values)
productSchema.index({ 'variations.sku': 1 }, { unique: true, sparse: true });
productSchema.index({ 'models.variations.sku': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);
