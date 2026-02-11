const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PageLayout = require('./models/PageLayout');

dotenv.config();

const seedLayout = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for seeding layout');

        // Clear existing layout
        await PageLayout.deleteMany({});

        const initialLayout = [
            { componentType: 'HERO_SLIDER', order: 1, isActive: true, pageSlug: 'home' },
            { componentType: 'CATEGORIES', order: 2, isActive: true, pageSlug: 'home' },
            { componentType: 'BRANDS', order: 3, isActive: true, pageSlug: 'home' },
            { componentType: 'FEATURED_PRODUCTS', order: 4, isActive: true, pageSlug: 'home' },
            { componentType: 'NEW_ARRIVALS', order: 5, isActive: true, pageSlug: 'home' },
            { componentType: 'SPECIAL_OFFERS', order: 6, isActive: true, pageSlug: 'home' },
            { componentType: 'WHY_CHOOSE_US', order: 7, isActive: true, pageSlug: 'home' }
        ];

        await PageLayout.insertMany(initialLayout);
        console.log('Initial Home Layout Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding layout:', error);
        process.exit(1);
    }
};

seedLayout();
