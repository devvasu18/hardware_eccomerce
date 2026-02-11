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
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],

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
    images: [{
        url: { type: String, required: true },
        altText: { type: String },
        isMain: { type: Boolean, default: false }
    }],

    // Legacy / Compatibility Fields (Auto-synced from 'images')
    featured_image: { type: String },
    featured_image_2: { type: String },
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
    isCancellable: { type: Boolean, default: true },
    isReturnable: { type: Boolean, default: true },
    deliveryTime: { type: String, default: '3-5 business days' },
    returnWindow: { type: Number, default: 7 }, // Days within which return/refund is allowed

    // Metrics
    views: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },

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

// AUTO-CALCULATE LOWEST PRICE ON SAVE
productSchema.pre('save', async function () {
    try {
        let minPrice = Infinity;
        let minMrp = Infinity;
        let hasVariants = false;

        // 1. Check Models
        if (this.models && this.models.length > 0) {
            this.models.forEach(m => {
                if (m.isActive !== false) {
                    // Check model base price
                    if (m.selling_price_a && m.selling_price_a > 0) {
                        if (m.selling_price_a < minPrice) {
                            minPrice = m.selling_price_a;
                            minMrp = m.mrp || minPrice; // best effort
                        }
                        hasVariants = true;
                    }

                    // Check model variations
                    if (m.variations && m.variations.length > 0) {
                        m.variations.forEach(v => {
                            if (v.isActive !== false && v.price > 0) {
                                if (v.price < minPrice) {
                                    minPrice = v.price;
                                    minMrp = v.mrp || v.price;
                                }
                                hasVariants = true;
                            }
                        });
                    }
                }
            });
        }

        // 2. Check Legacy Variations
        if (this.variations && this.variations.length > 0) {
            this.variations.forEach(v => {
                if (v.isActive !== false && v.price > 0) {
                    if (v.price < minPrice) {
                        minPrice = v.price;
                        minMrp = v.mrp || v.price;
                    }
                    hasVariants = true;
                }
            });
        }

        // 3. Update Root Fields if variants found
        if (hasVariants && minPrice !== Infinity) {
            this.selling_price_a = minPrice;
            this.discountedPrice = minPrice; // Alias

            // Only update MRP if we found a valid one, otherwise leave it (or set to minMrp)
            if (minMrp !== Infinity) {
                this.mrp = minMrp;
                this.basePrice = minMrp; // Alias
            }
        }

        // 4. Sync Legacy Image Fields
        if (this.images && this.images.length > 0) {
            // Find main image
            const mainImg = this.images.find(img => img.isMain) || this.images[0];
            this.featured_image = mainImg.url;

            // Set second image (for hover effects often used)
            if (this.images.length > 1) {
                const secondImg = this.images.find(img => !img.isMain && img.url !== mainImg.url) || this.images[1];
                this.featured_image_2 = secondImg.url;
            } else {
                this.featured_image_2 = null;
            }

            // Sync gallery (all images)
            this.gallery_images = this.images.map(img => img.url);
        }

    } catch (err) {
        console.error('Error in pre-save price calculation:', err);
        throw err;
    }
});

// SKU uniqueness constraints (sparse to allow empty values)
productSchema.index({ 'variations.sku': 1 }, { unique: true, sparse: true });
productSchema.index({ 'models.variations.sku': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);
