const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    imageUrl: { type: String, required: true }, // Category image
    displayOrder: { type: Number, default: 0 }, // For ordering categories
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 }, // Auto-calculated or manual
    gradient: { type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }, // Background gradient
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
