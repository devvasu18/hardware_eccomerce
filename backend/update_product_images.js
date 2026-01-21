const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

// Pool of high-quality images for each category
const categoryImagePool = {
    'engine-parts': [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=400&fit=crop', // Engine general
        'https://images.unsplash.com/photo-1597600278783-6cc35777a119?w=500&h=400&fit=crop', // Car engine
        'https://images.unsplash.com/photo-1627483296130-104c8610cc4f?w=500&h=400&fit=crop', // Engine block
        'https://images.unsplash.com/photo-1517524008697-546553299396?w=500&h=400&fit=crop'  // Mechanic working
    ],
    'brake-system': [
        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&h=400&fit=crop', // Brake disc
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=400&fit=crop', // Parts
        'https://images.unsplash.com/photo-1530046339160-711535b80360?w=500&h=400&fit=crop'  // Car wheel/brake area
    ],
    'suspension-steering': [
        'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=500&h=400&fit=crop', // Suspension
        'https://images.unsplash.com/photo-1552163462-8e100869d95f?w=500&h=400&fit=crop', // Undercarriage
        'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=500&h=400&fit=crop'  // Mechanical parts
    ],
    'electrical-parts': [
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500&h=400&fit=crop', // Battery/Charging
        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&h=400&fit=crop', // Tech parts
        'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=500&h=400&fit=crop'  // Wires/Lights
    ],
    'filters-fluids': [
        'https://images.unsplash.com/photo-1530268578403-bf3e6d22fc0b?w=500&h=400&fit=crop', // Oil
        'https://images.unsplash.com/photo-1635783685244-f2a89c9533c3?w=500&h=400&fit=crop', // Pouring oil
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=400&fit=crop'  // Fluid container
    ],
    'body-parts': [
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&h=400&fit=crop', // Modern car body
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&h=400&fit=crop', // Car side
        'https://images.unsplash.com/photo-1503376763036-066120622c74?w=500&h=400&fit=crop'  // Car front
    ],
    'lighting': [
        'https://images.unsplash.com/photo-1503376763036-066120622c74?w=500&h=400&fit=crop', // Headlights
        'https://images.unsplash.com/photo-1494905998402-395d579af9d5?w=500&h=400&fit=crop', // Tail lights
        'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=500&h=400&fit=crop'  // LED lights
    ],
    'tires-wheels': [
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&h=400&fit=crop', // Tire stack
        'https://images.unsplash.com/photo-1578844251758-2f71da645217?w=500&h=400&fit=crop', // Alloy wheel
        'https://images.unsplash.com/photo-1532588213355-52317771cce6?w=500&h=400&fit=crop'  // Tire close up
    ]
};

async function updateProductImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for updating product images...\n');

        const products = await Product.find({});

        let updatedCount = 0;

        for (const product of products) {
            const categoryPool = categoryImagePool[product.category];

            if (categoryPool && categoryPool.length > 0) {
                // Select a random image from the category pool to add variety
                // Or use consistent assignment based on product name length to keep it deterministic but varied
                const imageIndex = product.name.length % categoryPool.length;
                const mainImage = categoryPool[imageIndex];

                // For gallery, add a second image (just the next one in the pool)
                const secondImage = categoryPool[(imageIndex + 1) % categoryPool.length];

                await Product.findByIdAndUpdate(product._id, {
                    imageUrl: mainImage,
                    images: [mainImage, secondImage]
                });

                updatedCount++;
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} products with real images!`);
        console.log('\nRefresh your browser to see the changes.\n');

        process.exit(0);
    } catch (error) {
        console.error('Error updating product images:', error);
        process.exit(1);
    }
}

updateProductImages();
