const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const offerSchema = new mongoose.Schema({
    title: {
        en: { type: String, required: true },
        hi: { type: String }
    },
    slug: { type: String, required: true, unique: true },
    percentage: {
        type: Number,
        required: true,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100']
    },
    banner_image: { type: String }, // URL or path
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique slug before saving
offerSchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const titleEn = this.title?.en || (typeof this.title === 'string' ? this.title : '');
        const baseSlug = this.slug || slugify(titleEn);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Offer', offerSchema);
