const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
require('./models/Product');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        // 1. Create specific test user
        const username = 'bsmotortestinguser2';
        let user = await User.findOne({ username });

        if (!user) {
            console.log(`User ${username} not found, creating...`);
            user = await User.create({
                username: username,
                email: `${username}@example.com`,
                mobile: `9${Date.now().toString().slice(-9)}`, // Unique mobile
                password: 'password123',
                role: 'customer'
            });
        }
        console.log(`User: ${user.username} (${user._id})`);

        // 2. Get Product
        const product = await Product.findOne();
        if (!product) {
            console.log('No product found!');
            process.exit(1);
        }

        // 3. Create Order
        // Let's use a distinct amount to easily spot it in Tally
        const amount = 5555;

        const order = await Order.create({
            user: user._id,
            items: [{
                product: product._id,
                quantity: 1,
                priceAtBooking: amount,
                totalWithTax: amount
            }],
            totalAmount: amount,
            status: 'Delivered',
            paymentStatus: 'Paid',
            shippingAddress: 'Test Address for BS Motor 2',
            invoiceNumber: `INV-${Date.now()}`,
            tallyStatus: 'pending'
        });

        console.log(`\n✅ Created Order: ${order._id}`);
        console.log(`TOTAL AMOUNT: ${order.totalAmount}`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
