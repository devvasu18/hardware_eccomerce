const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');

dotenv.config();

const categoriesData = [
    { name: 'Engine Parts', slug: 'engine-parts', imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop' },
    { name: 'Brake System', slug: 'brake-system', imageUrl: 'https://images.unsplash.com/photo-1601000676461-291771457805?q=80&w=800&auto=format&fit=crop' },
    { name: 'Suspension & Steering', slug: 'suspension-steering', imageUrl: 'https://images.unsplash.com/photo-1550508538-34c56aec7f43?q=80&w=800&auto=format&fit=crop' },
    { name: 'Electrical Parts', slug: 'electrical-parts', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop' },
    { name: 'Filters & Fluids', slug: 'filters-fluids', imageUrl: 'https://images.unsplash.com/photo-1635773173369-02c38d61749a?q=80&w=800&auto=format&fit=crop' },
    { name: 'Body Parts', slug: 'body-parts', imageUrl: 'https://images.unsplash.com/photo-1627454820574-fb600aa5d4e1?q=80&w=800&auto=format&fit=crop' },
    { name: 'Lighting', slug: 'lighting', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ebdd9?q=80&w=800&auto=format&fit=crop' },
    { name: 'Tires & Wheels', slug: 'tires-wheels', imageUrl: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=800&auto=format&fit=crop' }
];

const selectedProducts = [
    // Engine Parts (3)
    {
        categorySlug: 'engine-parts',
        name: 'Engine Oil Filter',
        basePrice: 450,
        specifications: { Brand: 'Bosch', Warranty: '6 Months' },
        description: 'High-quality oil filter for all major car brands',
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'engine-parts',
        name: 'Spark Plug Set (4 pcs)',
        basePrice: 1200,
        specifications: { Brand: 'NGK', Warranty: '1 Year' },
        description: 'NGK iridium spark plugs for better performance',
        imageUrl: 'https://images.unsplash.com/photo-1597758399580-0a2da484274c?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'engine-parts',
        name: 'Air Filter Performance',
        basePrice: 2500,
        specifications: { Brand: 'K&N', Warranty: '2 Years' },
        description: 'Washable and reusable air filter',
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop'
    },

    // Brake System (3)
    {
        categorySlug: 'brake-system',
        name: 'Brake Pad Set (Front)',
        basePrice: 2800,
        specifications: { Brand: 'Brembo', Warranty: '1 Year' },
        description: 'Low dust ceramic brake pads',
        imageUrl: 'https://images.unsplash.com/photo-1601000676461-291771457805?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'brake-system',
        name: 'Brake Disc Rotor',
        basePrice: 4500,
        specifications: { Brand: 'Bosch', Warranty: '1 Year' },
        description: 'Ventilated disc rotors for better cooling',
        imageUrl: 'https://images.unsplash.com/photo-1582298538104-fe2e74c2ed54?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'brake-system',
        name: 'Brake Fluid DOT 4',
        basePrice: 450,
        specifications: { Brand: 'Castrol', Warranty: 'N/A' },
        description: 'High-performance brake fluid',
        imageUrl: 'https://images.unsplash.com/photo-1601000676461-291771457805?q=80&w=800&auto=format&fit=crop'
    },

    // Suspension (2)
    {
        categorySlug: 'suspension-steering',
        name: 'Shock Absorber Pair',
        basePrice: 5500,
        specifications: { Brand: 'Monroe', Warranty: '2 Years' },
        description: 'Gas-charged shock absorbers for smooth ride',
        imageUrl: 'https://images.unsplash.com/photo-1550508538-34c56aec7f43?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'suspension-steering',
        name: 'Power Steering Pump',
        basePrice: 6800,
        specifications: { Brand: 'OEM', Warranty: '1 Year' },
        description: 'Hydraulic power steering pump',
        imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800&auto=format&fit=crop'
    },

    // Electrical (3)
    {
        categorySlug: 'electrical-parts',
        name: 'Car Battery 12V 65Ah',
        basePrice: 6500,
        specifications: { Brand: 'Exide', Warranty: '3 Years' },
        description: 'Maintenance-free car battery',
        imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'electrical-parts',
        name: 'Alternator 120A',
        basePrice: 8500,
        specifications: { Brand: 'Bosch', Warranty: '1 Year' },
        description: 'High-output alternator for heavy loads',
        imageUrl: 'https://images.unsplash.com/photo-1555627228-59424294b4e9?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'electrical-parts',
        name: 'Headlight Bulb H4 LED',
        basePrice: 2800,
        specifications: { Brand: 'Philips', Warranty: '1 Year' },
        description: 'High-brightness LED bulbs pair',
        imageUrl: 'https://images.unsplash.com/photo-1555627228-59424294b4e9?q=80&w=800&auto=format&fit=crop'
    },

    // Filters & Fluids (2)
    {
        categorySlug: 'filters-fluids',
        name: 'Synthetic Motor Oil 5W-30',
        basePrice: 2800,
        specifications: { Brand: 'Mobil 1', Warranty: 'N/A' },
        description: 'Fully synthetic motor oil 5L',
        imageUrl: 'https://images.unsplash.com/photo-1635773173369-02c38d61749a?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'filters-fluids',
        name: 'Coolant Antifreeze',
        basePrice: 1200,
        specifications: { Brand: 'Prestone', Warranty: 'N/A' },
        description: 'Pre-mixed engine coolant 5L',
        imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=800&auto=format&fit=crop'
    },

    // Body Parts (2)
    {
        categorySlug: 'body-parts',
        name: 'Side Mirror Assembly',
        basePrice: 3800,
        specifications: { Brand: 'OEM', Warranty: '1 Year' },
        description: 'Electric side mirror with indicator',
        imageUrl: 'https://images.unsplash.com/photo-1627454820574-fb600aa5d4e1?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'body-parts',
        name: 'Front Bumper Primed',
        basePrice: 8500,
        specifications: { Brand: 'Aftermarket', Warranty: 'N/A' },
        description: 'Replacement front bumper cover',
        imageUrl: 'https://images.unsplash.com/photo-1618609571343-41bbd9646bde?q=80&w=800&auto=format&fit=crop'
    },

    // Lighting (2)
    {
        categorySlug: 'lighting',
        name: 'Fog Light Set',
        basePrice: 2400,
        specifications: { Brand: 'Hella', Warranty: '1 Year' },
        description: 'Fog lamp set with wiring kit',
        imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ebdd9?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'lighting',
        name: 'Tail Light Assembly',
        basePrice: 3200,
        specifications: { Brand: 'OEM', Warranty: '1 Year' },
        description: 'Rear tail light cluster left',
        imageUrl: 'https://images.unsplash.com/photo-1549480606-5386f6874402?q=80&w=800&auto=format&fit=crop'
    },

    // Tires & Wheels (3)
    {
        categorySlug: 'tires-wheels',
        name: 'All-Season Tire 195/65R15',
        basePrice: 4500,
        specifications: { Brand: 'Michelin', Warranty: '5 Years' },
        description: 'Radial passenger tire, high durability',
        imageUrl: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'tires-wheels',
        name: 'Alloy Wheel 16 inch',
        basePrice: 6500,
        specifications: { Brand: 'Enkei', Warranty: '3 Years' },
        description: 'Aluminum alloy rim 5-spoke design',
        imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da645217?q=80&w=800&auto=format&fit=crop'
    },
    {
        categorySlug: 'tires-wheels',
        name: 'Portable Air Compressor',
        basePrice: 1800,
        specifications: { Brand: 'Generic', Warranty: '1 Year' },
        description: '12V digital tire inflator pump',
        imageUrl: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=800&auto=format&fit=crop'
    }
];

// Total is 3+3+2+3+2+2+2+3 = 20 products.

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('Connected!');

        // 1. Clear existing data
        console.log('Clearing existing products and categories...');
        await Product.deleteMany({});
        await Category.deleteMany({});
        // Optionally clear brands if we want a fresh start, but maybe keep them?
        // Let's keep brands as user didn't explicitly say delete brands, only products.
        // But categories usually link products, so we need consistent categories.

        // 2. Create Categories
        console.log('Seeding Categories...');
        const createdCategories = {};
        for (const catData of categoriesData) {
            const cat = await Category.create({
                name: catData.name,
                slug: catData.slug,
                imageUrl: catData.imageUrl,
                productCount: 0 // will update later
            });
            createdCategories[cat.slug] = cat;
            console.log(`Created category: ${cat.name}`);
        }

        // 3. Create Products
        console.log('Seeding Products...');
        let count = 0;
        for (const p of selectedProducts) {
            const category = createdCategories[p.categorySlug];
            if (!category) {
                console.warn(`Category not found for ${p.categorySlug}`);
                continue;
            }

            const productData = {
                title: p.name, // Schema usually uses 'title' or 'name', current seed use 'title'
                name: p.name, // Just in case
                description: p.description,
                basePrice: p.basePrice,
                mrp: Math.floor(p.basePrice * 1.2),
                discountedPrice: Math.floor(p.basePrice * 0.9),
                selling_price_a: Math.floor(p.basePrice * 0.9),
                price: Math.floor(p.basePrice * 0.9), // legacy support
                stock: 50 + Math.floor(Math.random() * 50),
                sku: `AUTO-${Math.floor(Math.random() * 10000)}`,

                category: category._id, // Reference ID
                // brand: We could find a brand or leave null. 

                featured_image: p.imageUrl,
                images: [p.imageUrl],

                specifications: p.specifications,

                isFeatured: Math.random() > 0.7,
                isVisible: true,
                slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000)
            };

            await Product.create(productData);

            // Update category count
            await Category.findByIdAndUpdate(category._id, { $inc: { productCount: 1 } });

            count++;
        }

        console.log(`Successfully seeded ${count} autoparts products!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
}

seed();
