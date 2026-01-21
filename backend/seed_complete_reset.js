const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const SpecialOffer = require('./models/SpecialOffer');

dotenv.config();

// Categories to create
const CATEGORIES_DATA = [
    { name: 'Hand Tools', slug: 'hand-tools', description: 'Essential manual tools for every job', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)' },
    { name: 'Power Tools', slug: 'power-tools', description: 'High-performance electric tools', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Hardware & Fasteners', slug: 'hardware-fasteners', description: 'Nails, screws, and mounting hardware', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Paint & Supplies', slug: 'paint-supplies', description: 'Everything for your painting projects', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Safety & Gear', slug: 'safety-gear', description: 'Protective equipment for safe working', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
];

// Product Data (approx 10-15 per category)
const PRODUCTS_DATA = {
    'hand-tools': [
        { name: 'Professional Claw Hammer', keyword: 'hammer' },
        { name: 'Multi-Bit Screwdriver Set', keyword: 'screwdriver' },
        { name: 'Adjustable Wrench 10"', keyword: 'wrench' },
        { name: 'Needle Nose Pliers', keyword: 'pliers' },
        { name: 'Heavy Duty Tape Measure 5M', keyword: 'measuring-tape' },
        { name: 'Utility Knife Cutter', keyword: 'cutter' },
        { name: 'Spirit Level 24"', keyword: 'spirit-level' },
        { name: 'Wood Chisel Set', keyword: 'chisel' },
        { name: 'Hand Saw 15"', keyword: 'handsaw' },
        { name: 'Rubber Mallet', keyword: 'mallet' },
        { name: 'Allen Key Hex Set', keyword: 'allen-key' },
        { name: 'Locking Pliers', keyword: 'locking-pliers' }
    ],
    'power-tools': [
        { name: 'Cordless Drill Driver 18V', keyword: 'drill' },
        { name: 'Angle Grinder 4"', keyword: 'angle-grinder' },
        { name: 'Circular Saw 7-1/4"', keyword: 'circular-saw' },
        { name: 'Orbital Sander', keyword: 'sander' },
        { name: 'Jigsaw Variable Speed', keyword: 'jigsaw' },
        { name: 'Heat Gun 2000W', keyword: 'heat-gun' },
        { name: 'Rotary Tool Kit', keyword: 'rotary-tool' },
        { name: 'Electric Planer', keyword: 'planer' },
        { name: 'Impact Driver', keyword: 'impact-driver' },
        { name: 'Reciprocating Saw', keyword: 'reciprocating-saw' },
        { name: 'Bench Grinder', keyword: 'bench-grinder' }
    ],
    'hardware-fasteners': [
        { name: 'Assorted Steel Nails (1kg)', keyword: 'nails' },
        { name: 'Wood Screws Box (500pcs)', keyword: 'screws' },
        { name: 'Nut and Bolt Set', keyword: 'bolts' },
        { name: 'Stainless Steel Washers', keyword: 'washer' },
        { name: 'Door Hinges (Pair)', keyword: 'hinge' },
        { name: 'Heavy Duty Padlock', keyword: 'padlock' },
        { name: 'Steel Chain (1 Meter)', keyword: 'chain' },
        { name: 'Wall Plugs Assortment', keyword: 'wall-plugs' },
        { name: 'Door Handle Set', keyword: 'door-handle' },
        { name: 'L-Bracket Corner Brace', keyword: 'bracket' },
        { name: 'Drawer Slides (Pair)', keyword: 'drawer-slide' }
    ],
    'paint-supplies': [
        { name: 'Paint Brush Set (5 sizes)', keyword: 'paintbrush' },
        { name: 'Paint Roller Kit', keyword: 'paint-roller' },
        { name: 'Masking Tape (3 Pack)', keyword: 'masking-tape' },
        { name: 'Sandpaper Assortment', keyword: 'sandpaper' },
        { name: 'Paint Tray', keyword: 'paint-tray' },
        { name: 'Paint Thinner (1L)', keyword: 'paint-thinner' },
        { name: 'Spray Paint - Matte Black', keyword: 'spray-paint' },
        { name: 'Spray Paint - Gloss White', keyword: 'spray-paint' },
        { name: 'Drop Cloth Canvas', keyword: 'drop-cloth' },
        { name: 'Putty Knife Scraper', keyword: 'putty-knife' },
        { name: 'Caulking Gun', keyword: 'caulk-gun' }
    ],
    'safety-gear': [
        { name: 'Industrial Safety Helmet', keyword: 'helmet' },
        { name: 'Leather Work Gloves', keyword: 'gloves' },
        { name: 'Safety Goggles Anti-Fog', keyword: 'safety-glasses' },
        { name: 'Dust Mask N95 (Pack of 10)', keyword: 'mask' },
        { name: 'Ear Defenders / Muffs', keyword: 'ear-muffs' },
        { name: 'High Visibility Vest', keyword: 'safety-vest' },
        { name: 'Knee Pads Heavy Duty', keyword: 'knee-pads' },
        { name: 'Steel Toe Safety Boots', keyword: 'boots' },
        { name: 'Tool Belt Pouch', keyword: 'tool-belt' },
        { name: 'First Aid Kit Industrial', keyword: 'first-aid' },
        { name: 'Safety Harness', keyword: 'harness' }
    ]
};

async function seedCompleteReset() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('✓ Connected to DB\n');

        // 1. DELETE ALL DATA
        console.log('Deleting all existing data...');
        await Product.deleteMany({});
        await Category.deleteMany({});
        await SpecialOffer.deleteMany({});
        console.log('✓ Cleared Products, Categories, and Special Deals\n');

        // 2. CREATE CATEGORIES & PRODUCTS
        let allCreatedProducts = [];

        for (const catData of CATEGORIES_DATA) {
            // Create Category
            // Use a distinct image for category cover (generic tool/hardware image)
            const catImage = `https://loremflickr.com/800/600/hardware,${catData.slug.split('-')[0]}?lock=${Math.floor(Math.random() * 100)}`;

            const category = await Category.create({
                name: catData.name,
                slug: catData.slug,
                description: catData.description,
                imageUrl: catImage,
                gradient: catData.gradient
            });

            console.log(`Created Category: ${category.name}`);

            const productsInCat = PRODUCTS_DATA[catData.slug];
            const productsToInsert = [];

            for (const prodItem of productsInCat) {
                // Generate random pricing
                const basePrice = Math.floor(Math.random() * (5000 - 100) + 100);
                const discountPercent = Math.floor(Math.random() * (30 - 5) + 5);
                const discountedPrice = Math.floor(basePrice * (1 - discountPercent / 100));

                // Image URL: Simulate "grabbing" by using a search-based generator with specific keyword
                // Added a random lock to ensure uniqueness even if keywords are similar
                const imageUrl = `https://loremflickr.com/600/400/hardware,tool,${prodItem.keyword}?lock=${Math.floor(Math.random() * 1000)}`;

                productsToInsert.push({
                    name: prodItem.name,
                    description: `High quality ${prodItem.name} suitable for professional and home use.`,
                    basePrice: basePrice,
                    discountedPrice: discountedPrice,
                    stock: Math.floor(Math.random() * 100) + 10,
                    category: category.slug, // Use slug linking
                    imageUrl: imageUrl,
                    images: [
                        imageUrl,
                        `https://loremflickr.com/600/400/hardware,detail,${prodItem.keyword}?lock=${Math.floor(Math.random() * 1000)}`
                    ],
                    isOnDemand: false,
                    isVisible: true,
                    hsnCode: '82000000', // Generic HSN
                    brand: 'Generic',
                    warranty: '1 Year',
                    unit: 'Piece'
                });
            }

            const insertedProducts = await Product.insertMany(productsToInsert);
            allCreatedProducts = [...allCreatedProducts, ...insertedProducts];

            // Update Category count
            await Category.findByIdAndUpdate(category._id, { productCount: insertedProducts.length });
            console.log(`  -> Added ${insertedProducts.length} products to ${category.name}`);
        }

        // 3. CREATE SPECIAL DEALS
        console.log('\nCreating Special Deals...');
        // Shuffle products to pick random ones
        const shuffled = allCreatedProducts.sort(() => 0.5 - Math.random());
        const dealProducts = shuffled.slice(0, 5); // Pick 5 products

        const dealsToInsert = dealProducts.map((prod, index) => {
            const offerPrice = Math.floor(prod.discountedPrice * 0.9); // Further 10% off
            const discountPercent = Math.round(((prod.basePrice - offerPrice) / prod.basePrice) * 100);

            return {
                productId: prod._id,
                title: `Special on ${prod.name}`,
                badge: ['HOT DEAL', 'LIMITED', 'WEEKLY OFFER'][Math.floor(Math.random() * 3)],
                discountPercent: discountPercent,
                originalPrice: prod.basePrice,
                offerPrice: offerPrice,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
                isLimitedStock: true,
                isActive: true,
                displayOrder: index + 1
            };
        });

        await SpecialOffer.insertMany(dealsToInsert);
        console.log(`✓ Created ${dealsToInsert.length} Special Deals`);

        console.log('\n✅ Database reset and re-seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedCompleteReset();
