const mongoose = require('mongoose');
const { makeUniqueSlug, slugify } = require('../utils/slugify');

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSystem: { // Cannot be deleted
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure unique slug before saving
pageSchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const baseSlug = this.slug || slugify(this.title);
        this.slug = await makeUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model('Page', pageSchema);
