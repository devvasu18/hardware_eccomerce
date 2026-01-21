const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        console.log('Connected to DB');

        // Find users with admin privileges
        const admins = await User.find({
            role: { $in: ['super_admin', 'ops_admin', 'admin'] }
        });

        if (admins.length > 0) {
            console.log('Found Admin Users:');
            admins.forEach(u => {
                console.log(`- Username: ${u.username}`);
                console.log(`  Mobile: ${u.mobile}`);
                console.log(`  Role: ${u.role}`);
                console.log(`  Password: ${u.password}`); // Showing for convenience as per dev request
                console.log('---');
            });
        } else {
            console.log('No admin users found.');
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
