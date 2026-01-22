const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('./models/Banner');

dotenv.config();

const banners = [
    {
        title: 'Premium Engine Components',
        subtitle: 'Uncompromising performance for your vehicle. Explore our range of high-performance engine parts.',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1600&auto=format&fit=crop',
        position: 'center-left',
        buttonText: 'Shop Engines',
        buttonLink: '/products?category=engine-parts',
        order: 1
    },
    {
        title: 'Safety First: Precision Brakes',
        subtitle: 'Responsive braking power you can trust. High-quality pads, rotors, and calipers for every make.',
        image: 'https://images.unsplash.com/photo-1601000676461-291771457805?q=80&w=1600&auto=format&fit=crop',
        position: 'center-right',
        buttonText: 'View Brake Kits',
        buttonLink: '/products?category=brake-system',
        order: 2
    },
    {
        title: 'Illuminate the Road Ahead',
        subtitle: 'Crystal clear visibility with our premium lighting solutions. LED kits and headlight assemblies.',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ebdd9?q=80&w=1600&auto=format&fit=crop',
        position: 'bottom-left',
        buttonText: 'Shop Lighting',
        buttonLink: '/products?category=lighting',
        order: 3
    },
    {
        title: 'Master Your Suspension',
        subtitle: 'Smooth handling and superior control. Shock absorbers, struts, and more for the perfect ride.',
        image: 'https://images.unsplash.com/photo-1550508538-34c56aec7f43?q=80&w=1600&auto=format&fit=crop',
        position: 'center',
        buttonText: 'Upgrade Suspension',
        buttonLink: '/products?category=suspension-steering',
        order: 4
    }
];

async function seedBanners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for banner seeding...');

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('✓ Cleared existing banners');

        // Insert new banners
        const insertedBanners = await Banner.insertMany(banners);
        console.log(`✓ Inserted ${insertedBanners.length} new autoparts banners`);

        console.log('\n✅ Banners seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding banners:', error);
        process.exit(1);
    }
}

seedBanners();
