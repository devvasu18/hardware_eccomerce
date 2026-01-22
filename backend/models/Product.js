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

    // Status
    isActive: { type: Boolean, default: true },

    // Legacy fields preservation (optional, if needed to avoid breaking existing code immediately)
    // stock: { type: Number }, => maps to opening_stock
    // price: { type: Number }, => maps to selling_price_a

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
