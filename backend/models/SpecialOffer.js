const mongoose = require('mongoose');

const specialOfferSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true }, // Custom title for the offer
    badge: { type: String, default: 'HOT DEAL' }, // HOT DEAL, BUNDLE OFFER, CLEARANCE, etc.
    discountPercent: { type: Number, required: true }, // Calculated or manual
    originalPrice: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isLimitedStock: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual to check if offer is still valid
specialOfferSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
});

module.exports = mongoose.model('SpecialOffer', specialOfferSchema);
