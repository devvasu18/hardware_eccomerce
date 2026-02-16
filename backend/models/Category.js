const mongoose = require('mongoose');

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

// Cascade delete middleware would go here typically, but user requested "system MUST warn the user". 
// We will handle the check in the controller for safety.

module.exports = mongoose.model('Category', categorySchema);
