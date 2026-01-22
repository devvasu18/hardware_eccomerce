const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema({
    hsn_code: { type: String, required: true, unique: true },
    gst_rate: { type: Number, required: true }, // Percentage
}, { timestamps: true });

module.exports = mongoose.model('HSNCode', hsnCodeSchema);
