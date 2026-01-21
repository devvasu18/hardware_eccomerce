const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const seedData = async () => {
    try {
        // Clear existing
        await Product.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data...');

        // --- USERS ---
        const users = [
            {
                username: 'Super Admin',
                mobile: '9999999999',
                password: '123456',
                role: 'super_admin',
                customerType: 'regular'
            },
            {
                username: 'Rahul Customer',
                mobile: '9876543210',
                password: 'user',
                role: 'customer',
                customerType: 'regular',
                address: '101, Galaxy Apt, Vapi, Gujarat'
            },
            {
                username: 'Big Builder Corp',
                mobile: '9876543211',
                password: 'user',
                role: 'customer',
                customerType: 'superSpecialCustomer', // Wholesale access
                tallyLedgerName: 'Big Builder Corp Ltd',
                address: 'Plot 45, GIDC Phase 3, Vapi, Gujarat'
            }
        ];

        await User.insertMany(users);
        console.log('Users seeded!');

        // --- PRODUCTS ---
        const products = [
            {
                name: 'Bosch Professional Impact Drill GSB 550',
                category: 'Power Tools',
                basePrice: 5500,
                discountedPrice: 4200,
                stock: 45,
                gstRate: 18,
                hsnCode: '8467',
                cgst: 9, sgst: 9, igst: 18,
                isOnDemand: false,
                isVisible: true,
                isFeatured: true,
                isTopSale: true,
                // Unsplash: Drill/Power Tool
                images: ['https://images.unsplash.com/photo-1540560416513-058444c20792?q=80&w=800&auto=format&fit=crop'],
                specifications: { "Power": "550W", "Weight": "1.8kg", "RPM": "2800" },
                compatibilityTags: ["Concrete", "Wood", "Steel"],
                unit: 'piece'
            },
            {
                name: 'Industrial Safety Helmet - Yellow',
                category: 'Safety',
                basePrice: 1800,
                discountedPrice: 1200,
                stock: 250,
                gstRate: 12,
                hsnCode: '6506',
                cgst: 6, sgst: 6, igst: 12,
                // Unsplash: Construction Helmet
                images: ['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800&auto=format&fit=crop'],
                isOnDemand: false,
                isVisible: true,
                isFeatured: true,
                compatibilityTags: ["Construction", "Factory"],
                unit: 'set'
            },
            {
                name: 'Heavy Duty Floor Jack',
                category: 'Automotive & Heavy',
                basePrice: 8500,
                discountedPrice: 7800,
                stock: 8,
                gstRate: 18,
                hsnCode: '8425',
                cgst: 9, sgst: 9, igst: 18,
                // Unsplash: Mechanic/Car Repair
                images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800&auto=format&fit=crop'],
                specifications: { "Capacity": "3 Ton", "Lift Height": "400mm", "Material": "Alloy Steel" },
                unit: 'piece'
            },
            {
                name: 'Stainless Steel Hex Bolts',
                category: 'Hardware',
                basePrice: 450,
                discountedPrice: 380,
                stock: 120, // Boxes
                gstRate: 18,
                hsnCode: '7318',
                isOnDemand: false,
                isNewArrival: true,
                isFeatured: true,
                // Unsplash: Screws/Bolts
                images: ['https://images.unsplash.com/photo-1533475730635-f126db08cd53?q=80&w=800&auto=format&fit=crop'],
                unit: 'box'
            },
            {
                name: 'Industrial Generator 50kVA',
                category: 'Power Generation',
                basePrice: 450000,
                discountedPrice: 420000,
                stock: 0,
                gstRate: 18,
                hsnCode: '8502',
                isOnDemand: true,
                // Unsplash: Industrial Engine/Machine
                images: ['https://images.unsplash.com/photo-1532585973766-3b2d1645e56e?q=80&w=800&auto=format&fit=crop'],
                specifications: { "Output": "50kVA", "Fuel": "Diesel", "Phase": "3-Phase" },
                unit: 'setup'
            },
            {
                name: 'Fluke 17B Digital Multimeter',
                category: 'Measurement',
                basePrice: 3800,
                discountedPrice: 3200,
                stock: 2,
                gstRate: 18,
                hsnCode: '9030',
                // Unsplash: Electronics Testing
                images: ['https://images.unsplash.com/photo-1555627228-59424294b4e9?q=80&w=800&auto=format&fit=crop'],
                unit: 'piece'
            },
            {
                name: 'Solar Panel System',
                category: 'Renewable',
                basePrice: 12000,
                discountedPrice: 10500,
                stock: 20,
                gstRate: 5,
                hsnCode: '8541',
                cgst: 2.5, sgst: 2.5, igst: 5,
                // Unsplash: Solar Panels
                images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop'],
                unit: 'panel'
            }
        ];

        await Product.insertMany(products);
        console.log('Products seeded!');

        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
