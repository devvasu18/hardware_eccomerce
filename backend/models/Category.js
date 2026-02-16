const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String }, // Renamed to match frontend
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showInNav: { type: Boolean, default: false },
    gradient: { type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
}, { timestamps: true });

// Ensure unique slug before saving
categorySchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const baseSlug = this.slug || slugify(this.name);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
