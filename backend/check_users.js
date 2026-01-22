const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        console.log('Connected to MongoDB');
        const users = await User.find({}).select('username mobile role');
        console.log('All users:');
        users.forEach(u => {
            console.log(`- ${u.username} (${u.mobile}) - Role: ${u.role}`);
        });
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
