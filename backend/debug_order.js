const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

// Use the standard local mongo URI
// Remote URI from .env
const DB_URI = 'mongodb+srv://vasudevsharma:code4life%402007@cluster0.mo8nveo.mongodb.net/hardware_system?retryWrites=true&w=majority';

async function check() {
    try {
        await mongoose.connect(DB_URI);
        const orderId = '697221f8919638184e77c3fa';

        console.log('Checking Order:', orderId);

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
        } else {
            console.log('Trying to list last 5 orders to see what IDs look like:');
            const recent = await Order.find().sort({ _id: -1 }).limit(5);
            recent.forEach(o => console.log(o._id.toString()));
        }

        // Also check the user 1234567890
        const loginUser = await User.findOne({ mobile: '1234567890' });
        console.log('--------------------------------------------------');
        console.log('Login User (1234567890) found:', loginUser ? 'YES' : 'NO');
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
