const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Brand = require('./models/Brand');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Load env vars
dotenv.config();

// Connect
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seed = async () => {
    try {
        console.log('Clearing old data...');
        await Brand.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        // --- 1. Brands ---
        const brandsData = [
            { name: "Bosch", slug: "bosch", logo_image: "https://logo.clearbit.com/bosch.com" },
            { name: "Makita", slug: "makita", logo_image: "https://logo.clearbit.com/makitatools.com" },
            { name: "DeWalt", slug: "dewalt", logo_image: "https://logo.clearbit.com/dewalt.com" },
            { name: "Stanley", slug: "stanley", logo_image: "https://logo.clearbit.com/stanleytools.com" },
            { name: "3M", slug: "3m", logo_image: "https://logo.clearbit.com/3m.com" },
            { name: "Siemens", slug: "siemens", logo_image: "https://logo.clearbit.com/siemens.com" },
            { name: "Schneider", slug: "schneider", logo_image: "https://logo.clearbit.com/se.com" }
        ];

        console.log('Seeding Brands...');
        for (const b of brandsData) {
            await Brand.create(b);
        }

        // --- 2. Categories ---
        const categoriesData = [
            { name: "Power Tools", slug: "power-tools", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80", productCount: 15 },
            { name: "Hand Tools", slug: "hand-tools", imageUrl: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=400&q=80", productCount: 24 },
            { name: "Safety Gear", slug: "safety-gear", imageUrl: "https://images.unsplash.com/photo-1605335198426-384407887e41?auto=format&fit=crop&w=400&q=80", productCount: 8 },
            { name: "Electrical", slug: "electrical", imageUrl: "https://images.unsplash.com/photo-1555664424-778a69f45c94?auto=format&fit=crop&w=400&q=80", productCount: 42 },
            { name: "Fasteners", slug: "fasteners", imageUrl: "https://images.unsplash.com/photo-1585806653787-8c88df36368d?auto=format&fit=crop&w=400&q=80", productCount: 120 },
            { name: "Plumbing", slug: "plumbing", imageUrl: "https://images.unsplash.com/photo-1563293881-a8a5b29074b6?auto=format&fit=crop&w=400&q=80", productCount: 18 }
        ];

        console.log('Seeding Categories...');
        for (const c of categoriesData) {
            await Category.create(c);
        }

        // --- 3. Products ---
        console.log('Seeding Featured Products...');

        const productsData = [
            {
                title: "Bosch GSB 18V-50 Cordless Impact Drill",
                description: "Robust brushless motor for durability and flexibility.",
                basePrice: 12500,
                discountedPrice: 11999,
                mrp: 12500,
                selling_price_a: 11999,
                stock: 50,
                category: "Power Tools",
                brand: "Bosch",
                featured_image: "https://images.unsplash.com/photo-1622039918342-6e271a39d892?auto=format&fit=crop&w=800&q=80",
                isFeatured: true,
                isVisible: true,
                slug: "bosch-gsb-18v-50"
            },
            {
                title: "Stanley 100-Piece Mechanics Tool Set",
                description: "Complete set for professional mechanics with chrome finish.",
                basePrice: 8500,
                discountedPrice: 7999,
                mrp: 8500,
                selling_price_a: 7999,
                stock: 20,
                category: "Hand Tools",
                brand: "Stanley",
                featured_image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80",
                isFeatured: true,
                isVisible: true,
                slug: "stanley-100-piece-set"
            },
            {
                title: "3M SecureFit Safety Eyewear",
                description: "Anti-fog, clear lens safety glasses for industrial use.",
                basePrice: 450,
                discountedPrice: 399,
                mrp: 450,
                selling_price_a: 399,
                stock: 200,
                category: "Safety Gear",
                brand: "3M",
                featured_image: "https://images.unsplash.com/photo-1617260026227-2d88fae49865?auto=format&fit=crop&w=800&q=80",
                isFeatured: true,
                isVisible: true,
                slug: "3m-safety-eyewear"
            },
            {
                title: "Makita Angle Grinder 9557HP",
                description: "High performance motor with enough power for masonry cutting.",
                basePrice: 4200,
                discountedPrice: 3800,
                mrp: 4200,
                selling_price_a: 3800,
                stock: 35,
                category: "Power Tools",
                brand: "Makita",
                featured_image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
                isFeatured: true,
                isVisible: true,
                slug: "makita-angle-grinder"
            }
        ];

        for (const p of productsData) {
            const cat = await Category.findOne({ name: p.category });
            const brand = await Brand.findOne({ name: p.brand });

            if (cat) {
                await Product.create({
                    ...p,
                    category: cat._id,
                    brand: brand ? brand._id : null,
                    // Set all legacy/compat fields
                    price: p.selling_price_a
                });
            }
        }

        console.log('✅ Data Seeding Completed!');
        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seed();
