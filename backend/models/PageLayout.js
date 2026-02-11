const mongoose = require('mongoose');

const pageLayoutSchema = new mongoose.Schema({
    pageSlug: {
        type: String,
        default: 'home',
        index: true
    },
    componentType: {
        type: String,
        required: true
        // Allow any string for extensibility or keep enum if strict
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PageLayout', pageLayoutSchema);
