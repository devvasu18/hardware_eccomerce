const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    iconUrl: { type: String, required: true }, // Icon image URL
    color: { type: String, default: '#10b981' }, // Hex color for the feature
    stats: { type: String }, // e.g., "100% Certified", "24/7 Available"
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Feature', featureSchema);
