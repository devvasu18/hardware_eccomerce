const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        en: { type: String, trim: true },
        hi: { type: String, trim: true }
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        en: { type: String },
        hi: { type: String }
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
        en: { type: String, default: 'Shop Now' },
        hi: { type: String, default: 'अभी खरीदें' }
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
        en: { type: String, default: 'Premium Quality' },
        hi: { type: String, default: 'प्रीमियम गुणवत्ता' }
    }
}, {
    timestamps: true // created_at logic
});

const { makeUniqueSlug, slugify } = require('../utils/slugify');

// Auto-generate slug before save
bannerSchema.pre('save', async function (next) {
    if (this.isModified('title') || this.isModified('slug') || this.isNew) {
        let baseSlug = this.slug;
        const titleEn = this.title?.en || (typeof this.title === 'string' ? this.title : '') || 'banner';

        if (!baseSlug) {
            baseSlug = slugify(titleEn);
        }

        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Banner', bannerSchema);
