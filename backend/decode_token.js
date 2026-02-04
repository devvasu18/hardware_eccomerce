const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.log('Usage: node decode_token.js <token>');
    console.log('\nOr test with super admin login:');
    console.log('node decode_token.js test');
    process.exit(1);
}

if (token === 'test') {
    // Test by logging in as super admin
    const User = require('./models/User');
    const mongoose = require('mongoose');
    require('dotenv').config();

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system')
        .then(async () => {
            const user = await User.findOne({ mobile: '9999999999' });
            if (!user) {
                console.log('Super admin user not found!');
                process.exit(1);
            }

            console.log('Super Admin User from DB:');
            console.log('- ID:', user._id);
            console.log('- Username:', user.username);
            console.log('- Mobile:', user.mobile);
            console.log('- Role:', user.role);
            console.log('- Customer Type:', user.customerType);

            // Create a fresh token
            const newToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            console.log('\nFresh Token Generated:');
            console.log(newToken);

            // Decode it to verify
            const decoded = jwt.verify(newToken, JWT_SECRET);
            console.log('\nDecoded Token:');
            console.log(JSON.stringify(decoded, null, 2));

            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
} else {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token is valid!');
        console.log('Decoded payload:');
        console.log(JSON.stringify(decoded, null, 2));
    } catch (error) {
        console.error('Token verification failed:', error.message);
    }
}
