const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String
    },
    image: {
        type: String
        // Not required here - we validate on creation in controller
    },
    offer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
    product_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    position: {
        type: String,
        enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
        default: 'center-left'
    },
    textColor: {
        type: String,
        default: '#FFFFFF'
    },
    buttonColor: {
        type: String,
        default: '#0F172A'
    },
    buttonText: {
        type: String,
        default: 'Shop Now'
    },
    buttonLink: {
        type: String,
        default: '/products'
    },
    secondaryButtonColor: {
        type: String,
        default: '#FFFFFF'
    },
    showSecondaryButton: {
        type: Boolean,
        default: true
    },
    badgeText: {
        type: String,
        default: 'Premium Quality'
    }
}, {
    timestamps: true // created_at logic
});

// Auto-generate slug before save
// Auto-generate slug before save
bannerSchema.pre('save', async function () {
    if (this.isModified('title') && this.title) {
        // Simple slugify implementation
        this.slug = this.title
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-');  // Replace multiple - with single -
    } else if (!this.slug && !this.title) {
        // If no title and no slug, generate a random one or use ID if available (but pre-save ID might not be stable for slug? usually is)
        // Let's just generate a timestamp based slug if title is missing
        this.slug = 'banner-' + Date.now();
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
