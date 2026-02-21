const mongoose = require('mongoose');

const campaignInteractionSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomPushCampaign',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Can be null if the user isn't logged in when interacting
    },
    deviceToken: {
        type: String // Optional: to track anonymous device opens
    },
    event: {
        type: String,
        enum: ['DELIVERED', 'OPENED', 'CONVERTED'],
        required: true
    }
}, {
    timestamps: true
});

// Index to ensure unique events per campaign per user or token to prevent double counting
campaignInteractionSchema.index({ campaignId: 1, userId: 1, event: 1 });
campaignInteractionSchema.index({ campaignId: 1, deviceToken: 1, event: 1 });

module.exports = mongoose.model('CampaignInteraction', campaignInteractionSchema);
