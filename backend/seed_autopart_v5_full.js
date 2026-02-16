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
        console.log('Connected to MongoDB for V5 Autopart Seeding...');

        // 1. Clear Existing Data
        await Promise.all([
            Category.deleteMany({}),
            Brand.deleteMany({}),
            Product.deleteMany({}),
            Offer.deleteMany({}),
            HSNCode.deleteMany({})
        ]);
        console.log('✓ Cleared existing data');

        // 2. Create HSN Codes
        const hsnEngine = await HSNCode.create({ hsn_code: '8409', gst_rate: 18 });
        const hsnBrakes = await HSNCode.create({ hsn_code: '8708', gst_rate: 18 });
        const hsnLighting = await HSNCode.create({ hsn_code: '8512', gst_rate: 12 });
        const hsnWheels = await HSNCode.create({ hsn_code: '870870', gst_rate: 28 });
        const hsnSuspension = await HSNCode.create({ hsn_code: '870880', gst_rate: 18 });

        // 3. Create Brands
        const brands = await Brand.insertMany([
            { name: 'Apex Precision', slug: 'apex-precision' }, // 0
            { name: 'Nitro Dynamics', slug: 'nitro-dynamics' }, // 1
            { name: 'Lumina Tech', slug: 'lumina-tech' },     // 2
            { name: 'RoadMaster', slug: 'roadmaster' },       // 3
            { name: 'Titan Force', slug: 'titan-force' }      // 4
        ]);

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
            description: 'High-performance braking solutions.'
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
            description: 'Forged alloys and high-grip tires.'
        });
        const catSuspension = await Category.create({
            name: 'Suspension & Steering',
            slug: 'suspension-steering',
            imageUrl: 'https://images.unsplash.com/photo-1559815049-c0ae2432a677?w=500&auto=format&fit=crop&q=60',
            description: 'Shocks, struts, and steering components.'
        });

        // 5. Create Offers
        const offerLaunch = await Offer.create({
            title: 'Season Opener Sale',
            percentage: 20,
            slug: 'season-opener',
            validUntil: new Date('2026-12-31')
        });

        // 6. Create 10 Diverse Products
        const productsData = [
            // 1. Turbocharger (Engine) - Complex Product
            {
                title: 'High-Flow Turbocharger GTS-35',
                slug: 'high-flow-turbocharger-gts-35',
                category: catEngine._id,
                brand: brands[1]._id,
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 55000,
                selling_price_a: 42000,
                description: 'Boost your engine performance with the GTS-35 Turbocharger.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1626322979563-3e1174989d3d?w=800', isMain: true },
                    { url: 'https://images.unsplash.com/photo-1517524008697-84bef82b814e?w=800' }
                ],
                stock: 15,
                offers: [offerLaunch._id],
                isFeatured: true,
                isTopSale: true
            },
            // 2. Air Filter (Engine) - Simple Product
            {
                title: 'Performance High-Flow Air Filter',
                slug: 'performance-air-filter',
                category: catEngine._id,
                brand: brands[0]._id,
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 3500,
                selling_price_a: 2800,
                description: 'Washable and reusable high-flow air filter for better throttle response.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1542404071-92e10609536c?w=800', isMain: true }
                ],
                stock: 50,
                isNewArrival: true
            },
            // 3. Motor Oil (Engine) - Volume Variations
            {
                title: 'Titan Synthetic Motor Oil 5W-30',
                slug: 'titan-synthetic-oil-5w30',
                category: catEngine._id,
                brand: brands[4]._id,
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 1200, // Base price for smallest
                selling_price_a: 950,
                description: 'Advanced full synthetic formula for superior engine protection.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', isMain: true }
                ],
                stock: 100,
                variations: [
                    { type: 'Volume', value: '1 Liter', price: 950, mrp: 1200, stock: 60, sku: 'OIL-5W30-1L' },
                    { type: 'Volume', value: '4 Liters', price: 3200, mrp: 4000, stock: 40, sku: 'OIL-5W30-4L' }
                ]
            },
            // 4. Spark Plugs (Engine) - Pack Variations
            {
                title: 'Iridium Power Spark Plug',
                slug: 'iridium-spark-plug',
                category: catEngine._id,
                brand: brands[1]._id,
                hsn_code: hsnEngine._id,
                gst_rate: 18,
                mrp: 800,
                selling_price_a: 650,
                description: 'Improved ignitability and longer life with iridium center electrode.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1620921498308-4e89270f23cb?w=800', isMain: true }
                ],
                stock: 200,
                variations: [
                    { type: 'Pack', value: 'Single', price: 650, mrp: 800, stock: 100, sku: 'SPARK-1' },
                    { type: 'Pack', value: 'Set of 4', price: 2400, mrp: 3200, stock: 100, sku: 'SPARK-4' }
                ]
            },
            // 5. Brake Pads (Brakes) - Model Variations
            {
                title: 'Ceramic Brake Pad Set',
                slug: 'ceramic-brake-pad-set',
                category: catBrakes._id,
                brand: brands[0]._id,
                hsn_code: hsnBrakes._id,
                gst_rate: 18,
                mrp: 2500,
                selling_price_a: 1800,
                description: 'Low dust, noise-free braking performance.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1585250917646-c567cf674828?w=800', isMain: true } // Placeholder for brake pads
                ],
                stock: 80,
                models: [
                    {
                        name: 'Sedan Fitment',
                        mrp: 2500,
                        selling_price_a: 1800,
                        variations: [
                            { type: 'Other', value: 'Front Axle', price: 1800, mrp: 2500, stock: 40, sku: 'BP-SEDAN-F' },
                            { type: 'Other', value: 'Rear Axle', price: 1600, mrp: 2200, stock: 40, sku: 'BP-SEDAN-R' }
                        ]
                    },
                    {
                        name: 'SUV Fitment',
                        mrp: 3500,
                        selling_price_a: 2800,
                        variations: [
                            { type: 'Other', value: 'Front Axle', price: 2800, mrp: 3500, stock: 30, sku: 'BP-SUV-F' }
                        ]
                    }
                ]
            },
            // 6. Brake Rotors (Brakes) - Performance
            {
                title: 'Drilled & Slotted Sport Rotors',
                slug: 'drilled-slotted-rotors',
                category: catBrakes._id,
                brand: brands[3]._id,
                hsn_code: hsnBrakes._id,
                gst_rate: 18,
                mrp: 8000,
                selling_price_a: 6500,
                description: 'Enhanced cooling and bite for performance driving.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1620921498308-4e89270f23cb?w=800', isMain: true } // Using a mechanical part placeholder
                ],
                stock: 25,
                isOnDemand: true // Made to order
            },
            // 7. LED Headlights (Lighting) - Color Temp Variations
            {
                title: 'Lumina-X Pro LED Kit',
                slug: 'lumina-x-pro-led',
                category: catLighting._id,
                brand: brands[2]._id,
                hsn_code: hsnLighting._id,
                gst_rate: 12,
                mrp: 5500,
                selling_price_a: 3800,
                description: 'Brightest LED conversion kit on the market.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', isMain: true }
                ],
                stock: 60,
                variations: [
                    { type: 'Color', value: '6000K Cool White', price: 3800, mrp: 5500, stock: 30, sku: 'LED-6000K' },
                    { type: 'Color', value: '8000K Ice Blue', price: 3800, mrp: 5500, stock: 30, sku: 'LED-8000K' }
                ]
            },
            // 8. Car Battery (Electrical) - Amperage
            {
                title: 'Titan Force Heavy Duty Battery',
                slug: 'titan-force-battery',
                category: catLighting._id,
                brand: brands[4]._id,
                hsn_code: hsnLighting._id,
                gst_rate: 28,
                mrp: 6000,
                selling_price_a: 4500,
                description: 'Maintenance-free battery with 3-year warranty.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1620921498308-4e89270f23cb?w=800', isMain: true } // Generic part placeholder
                ],
                stock: 20,
                variations: [
                    { type: 'Battery', value: '35 Ah', price: 4500, mrp: 6000, stock: 10, sku: 'BAT-35AH' },
                    { type: 'Battery', value: '60 Ah', price: 6500, mrp: 8500, stock: 10, sku: 'BAT-60AH' }
                ]
            },
            // 9. Alloy Wheels (Wheels) - Size Variations
            {
                title: 'Stealth Matte Black Alloy Wheel',
                slug: 'stealth-black-alloy',
                category: catWheels._id,
                brand: brands[3]._id,
                hsn_code: hsnWheels._id,
                gst_rate: 28,
                mrp: 18000,
                selling_price_a: 14500,
                description: 'Aggressive design for modern sports cars. Price per wheel.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1579308630048-81d331405e46?w=800', isMain: true } // Wheel image
                ],
                stock: 40,
                variations: [
                    { type: 'Size', value: '16 Inch', price: 14500, mrp: 18000, stock: 20, sku: 'WHEEL-16' },
                    { type: 'Size', value: '17 Inch', price: 16500, mrp: 21000, stock: 20, sku: 'WHEEL-17' }
                ]
            },
            // 10. Coilover Kit (Suspension) - High Value
            {
                title: 'Adjustable Coilover Suspension Kit',
                slug: 'adjustable-coilover-kit',
                category: catSuspension._id,
                brand: brands[1]._id,
                hsn_code: hsnSuspension._id,
                gst_rate: 18,
                mrp: 85000,
                selling_price_a: 72000,
                description: 'Full height and damping adjustable suspension for track use.',
                images: [
                    { url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', isMain: true } // Using engine placeholder effectively as mechanical part
                ],
                stock: 5,
                isFeatured: true
            }
        ];

        for (const p of productsData) {
            await new Product(p).save();
        }
        console.log('✓ Created 10 Diverse Inventory Products');

        console.log('\n🚀 ALL DATA SEEDED SUCCESSFULLY!');
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedData();
