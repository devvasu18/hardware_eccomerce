const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    percentage: { type: Number, required: true },
    banner_image: { type: String }, // URL or path
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
