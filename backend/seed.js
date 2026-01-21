const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for Seeding');

        await User.deleteMany({});

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

        await User.insertMany(users);

        console.log('Seed Data Inserted Successfully');
        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedData();
