const mongoose = require('mongoose');

const homeLayoutSchema = new mongoose.Schema({
    componentType: {
        type: String,
        required: true,
        enum: [
            'HERO_SLIDER',
            'CATEGORIES',
            'BRANDS',
            'FEATURED_PRODUCTS',
            'NEW_ARRIVALS',
            'SPECIAL_OFFERS',
            'WHY_CHOOSE_US',
            'FLASH_SALE',
            'RECENTLY_VIEWED',
            'RECOMMENDED',
            'DEAL_OF_THE_DAY',
            'CATEGORY_PRODUCTS',
            'TRUST_BADGES',
            'TESTIMONIALS'
        ]
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

module.exports = mongoose.model('HomeLayout', homeLayoutSchema);
