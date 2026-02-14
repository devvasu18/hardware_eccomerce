const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('./models/Banner');

dotenv.config();

const banners = [
    {
        title: 'BEYOND STOPPING POWER',
        description: 'Elite Ceramic Brake Kits for uncompromising safety and precision. Engineered for heavy-duty performance.',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600&h=800',
        position: 'center-left',
        badgeText: 'Performance Series',
        buttonText: 'Shop Brake Kits',
        buttonLink: '/products?category=brakes',
        textColor: '#FFFFFF',
        buttonColor: '#F37021', // Theme Orange
        showSecondaryButton: true
    },
    {
        title: 'THE ART OF THE WHEEL',
        description: 'Forged Alloy Wheels that redefine your vehicle\'s silhouette. Lightweight, durable, and stunning.',
        image: 'https://images.unsplash.com/photo-1549233863-4239849b251a?auto=format&fit=crop&q=80&w=1600&h=800',
        position: 'center-right',
        badgeText: 'New Arrivals',
        buttonText: 'Explore Wheels',
        buttonLink: '/products?category=wheels',
        textColor: '#FFFFFF',
        buttonColor: '#0ea5e9', // Performance Blue
        showSecondaryButton: true
    },
    {
        title: 'UNLEASH THE BEAST',
        description: 'Premium Turbochargers and Cooling Systems. Experience maximum horsepower with our pro-grade engine internals.',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1600&h=800',
        position: 'bottom-left',
        badgeText: 'High Performance',
        buttonText: 'Upgrade Engine',
        buttonLink: '/products?category=engine',
        textColor: '#FFFFFF',
        buttonColor: '#ef4444', // Racing Red
        showSecondaryButton: false
    },
    {
        title: 'CRYSTAL CLEAR VISION',
        description: 'Advanced LED Headlight Assemblies and Lighting. 300% brighter than standard halogen for safer night driving.',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600&h=800',
        position: 'center',
        badgeText: 'Tech Innovation',
        buttonText: 'Shop Lighting',
        buttonLink: '/products?category=lighting',
        textColor: '#FFFFFF',
        buttonColor: '#eab308', // Visibility Gold
        showSecondaryButton: true
    }
];

async function seedBanners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected...');

        // Clear existing
        await Banner.deleteMany({});
        console.log('✓ Cleared old banners');

        // Insert new
        for (const bannerData of banners) {
            await new Banner(bannerData).save();
        }
        console.log(`✓ Inserted ${banners.length} Premium Autopart Banners`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
}

seedBanners();
