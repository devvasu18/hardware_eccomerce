const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const SpecialOffer = require('./models/SpecialOffer');
const Feature = require('./models/Feature');
const TrustIndicator = require('./models/TrustIndicator');
const Product = require('./models/Product');

dotenv.config();

// Auto Parts Categories
const categories = [
    {
        name: 'Engine Parts',
        slug: 'engine-parts',
        description: 'Complete range of engine components and accessories',
        imageUrl: 'https://loremflickr.com/800/600/engine',
        displayOrder: 1,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        productCount: 0
    },
    {
        name: 'Brake System',
        slug: 'brake-system',
        description: 'Brake pads, discs, calipers and complete brake kits',
        imageUrl: 'https://loremflickr.com/800/600/brakes',
        displayOrder: 2,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        productCount: 0
    },
    {
        name: 'Suspension & Steering',
        slug: 'suspension-steering',
        description: 'Shock absorbers, struts, control arms and steering parts',
        imageUrl: 'https://loremflickr.com/800/600/suspension',
        displayOrder: 3,
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        productCount: 0
    },
    {
        name: 'Electrical Parts',
        slug: 'electrical-parts',
        description: 'Batteries, alternators, starters and wiring components',
        imageUrl: 'https://loremflickr.com/800/600/battery,car',
        displayOrder: 4,
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        productCount: 0
    },
    {
        name: 'Filters & Fluids',
        slug: 'filters-fluids',
        description: 'Oil filters, air filters, fuel filters and automotive fluids',
        imageUrl: 'https://loremflickr.com/800/600/oil,car',
        displayOrder: 5,
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        productCount: 0
    },
    {
        name: 'Body Parts',
        slug: 'body-parts',
        description: 'Bumpers, fenders, doors, hoods and body panels',
        imageUrl: 'https://loremflickr.com/800/600/car,body',
        displayOrder: 6,
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        productCount: 0
    },
    {
        name: 'Lighting',
        slug: 'lighting',
        description: 'Headlights, tail lights, fog lights and LED accessories',
        imageUrl: 'https://loremflickr.com/800/600/headlight',
        displayOrder: 7,
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        productCount: 0
    },
    {
        name: 'Tires & Wheels',
        slug: 'tires-wheels',
        description: 'All season tires, alloy wheels and wheel accessories',
        imageUrl: 'https://loremflickr.com/800/600/tire,wheel',
        displayOrder: 8,
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        productCount: 0
    }
];

// Features for "Why Choose Us"
const features = [
    {
        title: 'Genuine Parts',
        description: 'All auto parts are 100% genuine and sourced from certified manufacturers. Quality guaranteed with warranty on all products.',
        iconUrl: '/images/icons/genuine.png',
        color: '#10b981',
        stats: '100% Certified',
        displayOrder: 1
    },
    {
        title: 'Fast Delivery',
        description: 'Same-day dispatch for in-stock items. Track your order in real-time from warehouse to your doorstep.',
        iconUrl: '/images/icons/delivery.png',
        color: '#3b82f6',
        stats: '24-48 Hours',
        displayOrder: 2
    },
    {
        title: 'Wholesale Pricing',
        description: 'Competitive bulk pricing for garages and workshops. Special discounts for registered wholesale customers.',
        iconUrl: '/images/icons/pricing.png',
        color: '#f59e0b',
        stats: 'Up to 30% Off',
        displayOrder: 3
    },
    {
        title: 'Expert Support',
        description: 'Dedicated automotive experts to help you find the right parts. Technical assistance available round the clock.',
        iconUrl: '/images/icons/support.png',
        color: '#8b5cf6',
        stats: '24/7 Available',
        displayOrder: 4
    },
    {
        title: 'Tally Integration',
        description: 'Seamless integration with Tally ERP. Automatic invoice generation and inventory sync for smooth operations.',
        iconUrl: '/images/icons/tally.png',
        color: '#ec4899',
        stats: 'Auto Sync',
        displayOrder: 5
    },
    {
        title: 'Trusted Partner',
        description: 'Serving automotive industry for years. Built on trust, reliability, and customer satisfaction.',
        iconUrl: '/images/icons/trust.png',
        color: '#f37021',
        stats: '1000+ Garages',
        displayOrder: 6
    }
];

// Trust Indicators
const trustIndicators = [
    { label: 'Happy Customers', value: '1000+', displayOrder: 1 },
    { label: 'Auto Parts', value: '5000+', displayOrder: 2 },
    { label: 'Satisfaction Rate', value: '99.8%', displayOrder: 3 },
    { label: 'Support', value: '24/7', displayOrder: 4 }
];

async function seedHomepageData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for seeding...');

        // Clear existing data
        await Category.deleteMany({});
        await Feature.deleteMany({});
        await TrustIndicator.deleteMany({});
        console.log('Cleared existing homepage data');

        // Insert categories
        const insertedCategories = await Category.insertMany(categories);
        console.log(`✓ Inserted ${insertedCategories.length} categories`);

        // Insert features
        const insertedFeatures = await Feature.insertMany(features);
        console.log(`✓ Inserted ${insertedFeatures.length} features`);

        // Insert trust indicators
        const insertedIndicators = await TrustIndicator.insertMany(trustIndicators);
        console.log(`✓ Inserted ${insertedIndicators.length} trust indicators`);

        console.log('\n✅ Homepage data seeded successfully!');
        console.log('\nNote: Special offers need to be created through admin panel with actual product references.');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedHomepageData();
