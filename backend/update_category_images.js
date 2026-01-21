const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

// Real image URLs from free image sources (Unsplash/Pexels)
const categoryImages = {
    'engine-parts': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop',
    'brake-system': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=400&fit=crop',
    'suspension-steering': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&h=400&fit=crop',
    'electrical-parts': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=400&fit=crop',
    'filters-fluids': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'body-parts': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop',
    'lighting': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop',
    'tires-wheels': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
};

async function updateCategoryImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for updating category images...\n');

        const categories = await Category.find({});

        let updated = 0;
        for (const category of categories) {
            const imageUrl = categoryImages[category.slug];

            if (imageUrl) {
                await Category.findByIdAndUpdate(category._id, {
                    imageUrl: imageUrl
                });
                console.log(`✓ Updated ${category.name} with image`);
                updated++;
            }
        }

        console.log(`\n✅ Successfully updated ${updated} category images!`);
        console.log('\nRefresh your browser to see the real images!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error updating category images:', error);
        process.exit(1);
    }
}

updateCategoryImages();
