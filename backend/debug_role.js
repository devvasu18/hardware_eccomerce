const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'admin'];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        const user = await User.findOne({ mobile: '9999999999' }).select('-password');
        console.log('User found:', user.username);
        console.log('Role from DB:', user.role);
        console.log('Role type:', typeof user.role);
        console.log('Roles allowed:', adminRoles);
        console.log('Included?:', adminRoles.includes(user.role));

        if (adminRoles.includes(user.role)) {
            console.log('MATCH FOUND');
        } else {
            console.log('NO MATCH');
        }

        process.exit();
    });
