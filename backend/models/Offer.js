const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
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
        const baseSlug = this.slug || slugify(this.title);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Offer', offerSchema);
