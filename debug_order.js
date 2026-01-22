const mongoose = require('mongoose');
const Order = require('./backend/models/Order');
const User = require('./backend/models/User');

const DB_URI = 'mongodb://127.0.0.1:27017/hardware_ecommerce'; // Guessing the URI based on typical setups, or I'll check .env if this fails. 
// Actually I should check where the backend connects.
// But mostly it's local.

async function check() {
    try {
        await mongoose.connect(DB_URI);
        const orderId = '697221f8919638184e77c3fa';

        // Try to cast to ObjectId just to see if it's strictly valid, though findById handles strings usually.
        // The ID 697221f8919638184e77c3fa is strange. 
        // 69... is 2071? No. 6*16 = 96.
        // Standard MongoIDs: 4 bytes timestamp.
        // 697221f8 -> 1769103864. 
        // 1769103864 seconds = Year 2026!
        // So it is a valid ID from the future (or current time if the user machine is in 2026).
        // Wait, the additional metadata says: The current local time is: 2026-01-22T19:30:35+05:30.
        // So yes, it is valid.

        const order = await Order.findById(orderId);
        console.log('Order found:', order ? 'YES' : 'NO');
        if (order) {
            console.log('Order User:', order.user);
            console.log('Is Guest Order:', order.isGuestOrder);
            console.log('Status:', order.status);

            if (order.user) {
                const user = await User.findById(order.user);
                console.log('User found:', user ? 'YES' : 'NO');
                if (user) {
                    console.log('User Mobile:', user.mobile);
                    console.log('User ID:', user._id);
                    console.log('User Role:', user.role);
                }
            }
        }

        // Also check the user 1234567890
        const loginUser = await User.findOne({ mobile: '1234567890' });
        console.log('Login User found:', loginUser ? 'YES' : 'NO');
        if (loginUser) {
            console.log('Login User ID:', loginUser._id);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
