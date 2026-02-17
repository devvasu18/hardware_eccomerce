const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const subCategorySchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: {
        en: { type: String, required: true },
        hi: { type: String }
    },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
}, { timestamps: true });

// Ensure unique slug before saving
subCategorySchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        // Use English name for slug generation
        const nameForSlug = this.name?.en || (typeof this.name === 'string' ? this.name : '');
        const baseSlug = this.slug || slugify(nameForSlug);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
