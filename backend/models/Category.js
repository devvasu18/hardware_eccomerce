const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String }, // Renamed from imageUrl to match requirement, but can keep both or alias
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Cascade delete middleware would go here typically, but user requested "system MUST warn the user". 
// We will handle the check in the controller for safety.

module.exports = mongoose.model('Category', categorySchema);
