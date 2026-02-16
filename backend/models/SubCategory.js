const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const subCategorySchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
}, { timestamps: true });

// Ensure unique slug before saving
subCategorySchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const baseSlug = this.slug || slugify(this.name);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
