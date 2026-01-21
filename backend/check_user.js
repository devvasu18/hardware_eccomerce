const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        console.log('Connected to DB');

        // Search for both variations to be sure
        const users = await User.find({
            $or: [
                { mobile: /123456/ } // broad search
            ]
        });

        console.log('Found Users matching pattern 123456*:');
        users.forEach(u => {
            console.log(`- Username: ${u.username}, Mobile: ${u.mobile}, ID: ${u._id}`);
        });

        if (users.length === 0) {
            console.log('No users found matching 123456*');
            const allUsers = await User.find({}).limit(5);
            console.log('First 5 users in DB:', allUsers.map(u => u.mobile));
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
