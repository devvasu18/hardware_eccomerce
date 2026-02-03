const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const timestamp = Date.now();
        const user = await User.create({
            username: 'Debug User',
            email: `debug_${timestamp}@test.com`,
            mobile: String(timestamp).slice(-10),
            password: 'password123'
        });
        console.log('User created:', user._id);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testUser();
