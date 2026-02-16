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

const { makeUniqueSlug, slugify } = require('../utils/slugify');

// Auto-generate slug before save
bannerSchema.pre('save', async function (next) {
    if (this.isModified('title') || this.isModified('slug') || this.isNew) {
        let baseSlug = this.slug;
        if (!baseSlug && this.title) {
            baseSlug = slugify(this.title);
        } else if (!baseSlug && !this.title) {
            baseSlug = 'banner';
        }

        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Banner', bannerSchema);
