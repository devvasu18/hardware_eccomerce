const mongoose = require('mongoose');

const trustIndicatorSchema = new mongoose.Schema({
    label: { type: String, required: true }, // e.g., "Happy Clients"
    value: { type: String, required: true }, // e.g., "1000+"
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('TrustIndicator', trustIndicatorSchema);
