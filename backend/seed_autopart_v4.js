const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Product = require('./models/Product');
const Offer = require('./models/Offer');
const HSNCode = require('./models/HSNCode');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system';

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for Complete Autopart Seeding...');

        // 1. Clear Existing Data
        await Promise.all([
            Category.deleteMany({}),
            Brand.deleteMany({}),
            Product.deleteMany({}),
            Offer.deleteMany({}),
            HSNCode.deleteMany({})
        ]);
        console.log('✓ Cleared existing Categories, Brands, Products, Offers, and HSN Codes');

        // 2. Create HSN Codes
        const hsnEngine = await HSNCode.create({ hsn_code: '8409', gst_rate: 18 });
        const hsnBrakes = await HSNCode.create({ hsn_code: '8708', gst_rate: 18 });
        const hsnLighting = await HSNCode.create({ hsn_code: '8512', gst_rate: 12 });
        const hsnWheels = await HSNCode.create({ hsn_code: '870870', gst_rate: 28 });
        console.log('✓ Created HSN Codes');

        // 3. Create Brands
        const brands = await Brand.insertMany([
            { name: 'Apex Precision', slug: 'apex-precision' },
            { name: 'Nitro Dynamics', slug: 'nitro-dynamics' },
            { name: 'Lumina Tech', slug: 'lumina-tech' },
            { name: 'RoadMaster', slug: 'roadmaster' }
        ]);
        console.log('✓ Created Brands');

        // 4. Create Categories
        const catEngine = await Category.create({
            name: 'Engine Components',
            slug: 'engine-components',
            imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400&h=400',
            description: 'Core engine parts including turbos, gaskets, and pistons.'
        });
        const catBrakes = await Category.create({
            name: 'Brake Systems',
            slug: 'brake-systems',
            imageUrl: 'https://images.unsplash.com/photo-1549233863-4239849b251a?auto=format&fit=crop&q=80&w=400&h=400',
            description: 'High-performance braking solutions for safety and control.'
        });
        const catLighting = await Category.create({
            name: 'Lighting & Electrical',
            slug: 'lighting-electrical',
            imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400&h=400',
            description: 'Advanced LED kits and electrical components.'
        });
        const catWheels = await Category.create({
            name: 'Wheels & Tires',
            slug: 'wheels-tires',
            imageUrl: 'https://images.unsplash.com/photo-1549233863-4239849b251a?auto=format&fit=crop&q=80&w=400&h=400',
            description: 'Forged alloys and high-grip tires for all terrains.'
        });
        console.log('✓ Created Categories');

        // 5. Create Offers
        const offerInaugural = await Offer.create({
            title: 'Inaugural Launch Offer',
            percentage: 15,
            slug: 'inaugural-offer',
            validUntil: new Date('2026-12-31')
        });
        console.log('✓ Created Offers');

        // 6. Create Products
        const productsData = [
            // Engine Parts
            {
                title: 'High-Flow Turbocharger GTS-35',
                slug: 'high-flow-turbocharger-gts-35',
                category: catEngine._id,
                brand: brands[1]._id, // Nitro Dynamics
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 55000,
                selling_price_a: 42000,
                description: 'Boost your engine performance with the GTS-35 Turbocharger. Featuring ceramic ball bearings and a precision-engineered compressor wheel.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true },
                    { url: 'https://images.unsplash.com/photo-1517524008697-84bef82b814e?auto=format&fit=crop&q=80&w=1000&h=1000' }
                ],
                stock: 15,
                offers: [offerInaugural._id],
                isFeatured: true
            },
            {
                title: 'Multi-Layer Steel Gasket Set',
                slug: 'mls-gasket-set',
                category: catEngine._id,
                brand: brands[0]._id, // Apex Precision
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 8500,
                selling_price_a: 6800,
                description: 'High-strength MLS gasket set for extreme cylinder pressures. Perfect for tuned or racing engines.',
                images: [
                    { url: 'https://images.unsplash.com/photo-11504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true }
                ],
                stock: 40,
                isNewArrival: true
            },
            // Brakes
            {
                title: 'Z-Series Ceramic Brake Pads',
                slug: 'z-series-ceramic-pads',
                category: catBrakes._id,
                brand: brands[0]._id, // Apex
                hsn_code: hsnBrakes._id,
                gst_rate: 18,
                mrp: 4500,
                selling_price_a: 3200,
                description: 'Ultra-low dust, noiseless ceramic braking for luxury and performance vehicles.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true }
                ],
                stock: 120,
                offers: [offerInaugural._id]
            },
            {
                title: 'Vented Performance Rotors',
                slug: 'vented-performance-rotors',
                category: catBrakes._id,
                brand: brands[3]._id, // RoadMaster
                hsn_code: hsnBrakes._id,
                gst_rate: 18,
                mrp: 12000,
                selling_price_a: 9500,
                description: 'Cross-drilled and slotted rotors for superior heat dissipation.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1533475730635-f126db08cd53?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true }
                ],
                stock: 25,
                isTopSale: true
            },
            // Lighting
            {
                title: 'Lumina-X LED Headlight Kit',
                slug: 'lumina-x-led-kit',
                category: catLighting._id,
                brand: brands[2]._id, // Lumina
                hsn_code: hsnLighting._id,
                gst_rate: 12,
                mrp: 7500,
                selling_price_a: 5500,
                description: '6000K Pure White light, 12000 Lumens output. Plug and play installation.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true }
                ],
                stock: 80,
                offers: [offerInaugural._id],
                models: [
                    { name: 'H7 Standard', mrp: 7500, selling_price_a: 5500, variations: [{ type: 'Pack', value: '2 Pcs', price: 5500, mrp: 7500, stock: 40 }] },
                    { name: 'H4 Dual-Beam', mrp: 8500, selling_price_a: 6500, variations: [{ type: 'Pack', value: '2 Pcs', price: 6500, mrp: 8500, stock: 40 }] }
                ]
            },
            // Wheels
            {
                title: 'Venom-5 Forged Alloy Wheel',
                slug: 'venom-5-forged-wheel',
                category: catWheels._id,
                brand: brands[1]._id, // Nitro
                hsn_code: hsnWheels._id,
                gst_rate: 28,
                mrp: 25000,
                selling_price_a: 18500,
                description: 'Lightweight forged aluminum wheel with a gunmetal finish. Sold per piece.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1549233863-4239849b251a?auto=format&fit=crop&q=80&w=1000&h=1000', isMain: true }
                ],
                stock: 32,
                variations: [
                    { type: 'Size', value: '17 Inch', price: 18500, mrp: 25000, stock: 16 },
                    { type: 'Size', value: '18 Inch', price: 21500, mrp: 28000, stock: 16 }
                ]
            }
        ];

        for (const p of productsData) {
            await new Product(p).save();
        }
        console.log('✓ Created Products with Variants and Models');

        console.log('\n🚀 ALL DATA SEEDED SUCCESSFULLY!');
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedData();
