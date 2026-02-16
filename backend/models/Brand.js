const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo_image: { type: String },
    // Optional: Link to categories for filtering "Honda matches Two-Wheelers"
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
}, { timestamps: true });

// Ensure unique slug before saving
brandSchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const baseSlug = this.slug || slugify(this.name);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Brand', brandSchema);
