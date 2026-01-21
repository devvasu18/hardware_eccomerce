const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB\n');
    listAllUsers();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function listAllUsers() {
    try {
        console.log('📊 ALL USERS IN DATABASE');
        console.log('='.repeat(80));

        const users = await User.find().select('-password').sort({ createdAt: -1 });

        console.log(`\nTotal Users: ${users.length}\n`);

        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username}`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Mobile: ${user.mobile}`);
                console.log(`   Email: ${user.email || 'Not provided'}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Customer Type: ${user.customerType}`);
                console.log(`   Address: ${user.address || 'Not provided'}`);
                console.log(`   Wholesale Discount: ${user.wholesaleDiscount}%`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Updated: ${user.updatedAt}`);
                console.log('-'.repeat(80));
            });
        }

        console.log('\n✅ Query completed successfully\n');

    } catch (error) {
        console.error('❌ Error fetching users:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}
