const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
require('./models/Product');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        // 1. Find or Create User
        let user = await User.findOne({ username: 'bsmotortestinguser' });
        if (!user) {
            console.log('User not found, creating new user...');
            user = await User.create({
                username: 'bsmotortestinguser',
                email: 'bsmotortest@example.com',
                mobile: `9${Date.now().toString().slice(-9)}`, // Unique mobile
                password: 'password123', // Dummy password
                role: 'customer'
            });
        }
        console.log(`User: ${user.username} (${user._id})`);

        // 2. Get a Product
        const product = await Product.findOne();
        if (!product) {
            console.log('No product found! Please seed products first.');
            process.exit(1);
        }
        console.log(`Product: ${product.title} (${product._id})`);

        // 3. Create Order
        // We need the items total to add up to roughly the amount or just force the total.
        // Tax calc is usually derived, but for Tally sync test, we largely care about the final numbers pushed.
        // Let's set quantity and price to match 4343.
        // 4343 total.

        const order = await Order.create({
            user: user._id,
            items: [{
                product: product._id,
                quantity: 1,
                priceAtBooking: 4343,
                totalWithTax: 4343
            }],
            totalAmount: 4343,
            status: 'Delivered',
            paymentStatus: 'Paid',
            shippingAddress: 'Test Address for BS Motor',
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
