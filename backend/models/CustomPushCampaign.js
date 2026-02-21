const mongoose = require('mongoose');

const customPushCampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String }, // optional banner/product image
    ctaText: { type: String, default: 'View Deal' },
    targetScreen: {
        type: String,
        enum: ['PRODUCT', 'OFFER', 'DEAL'],
        required: true
    },
    targetId: { type: String }, // The ID of the product or offer
    sound: { type: String, default: 'default' },
    targetAudience: {
        type: String,
        enum: ['ALL', 'LOGGED_IN', 'SEGMENT'],
        default: 'ALL'
    },
    segment: {
        type: String,
        enum: ['NEW_USER', 'RETURNING_USER', 'PREVIOUS_BUYERS', null],
        default: null
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'SENT'],
        default: 'DRAFT'
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: {
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        converted: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CustomPushCampaign', customPushCampaignSchema);
