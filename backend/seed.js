const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for Seeding');

        await Product.deleteMany({});
        await User.deleteMany({});

        const products = [
            {
                name: "Heavy Duty Ball Bearing 6204",
                description: "Industrial grade SKF compatible ball bearing. High RPM support.",
                basePrice: 450,
                wholesalePrice: 400,
                stock: 150,
                category: "Bearings",
                images: ["https://placehold.co/400?text=Bearing+6204"],
                isVisible: true,
                isOnDemand: false
            },
            {
                name: "Hydraulic Cylinder 5 Ton",
                description: "Double acting hydraulic cylinder for heavy machinery.",
                basePrice: 5500,
                wholesalePrice: 4800,
                stock: 12,
                category: "Hydraulics",
                images: ["https://placehold.co/400?text=Hydraulic+Cylinder"],
                isVisible: true,
                isOnDemand: false
            },
            {
                name: "Industrial V-Belt B-52",
                description: "Rubber V-Belt for transmission drives.",
                basePrice: 200,
                wholesalePrice: 150,
                stock: 500,
                category: "Transmission",
                images: ["https://placehold.co/400?text=V-Belt+B-52"],
                isVisible: true,
                isOnDemand: false
            },
            {
                name: "Siemens Contactor 3TF",
                description: "Special procurement item. 3-pole contactor.",
                basePrice: 3200,
                wholesalePrice: 2900,
                stock: 0,
                category: "Electrical",
                images: ["https://placehold.co/400?text=Siemens+Contactor"],
                isVisible: true,
                isOnDemand: true // ON DEMAND ITEM
            }
        ];

        const users = [
            {
                username: "admin",
                mobile: "9999999999",
                password: "admin", // Plaintext for demo, should be hashed in prod
                role: "admin",
                tallyLedgerName: "Chamunda Internal"
            },
            {
                username: "rahul_workshop",
                mobile: "9876543210",
                password: "123",
                role: "customer",
                customerType: "specialCustomer", // Gets discount
                tallyLedgerName: "Rahul Workshop Ltd"
            },
            {
                username: "new_buyer",
                mobile: "9111111111",
                password: "123",
                role: "customer",
                customerType: "regular",
                tallyLedgerName: "New Buyer Individual"
            }
        ];

        await Product.insertMany(products);
        await User.insertMany(users);

        console.log('Seed Data Inserted Successfully');
        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedData();
