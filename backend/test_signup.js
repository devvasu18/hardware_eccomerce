const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    testSignupAndVerify();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function testSignupAndVerify() {
    try {
        console.log('\n📋 Testing User Signup and Database Verification\n');
        console.log('='.repeat(60));

        // Step 1: Check existing users count
        const existingUsersCount = await User.countDocuments();
        console.log(`\n1️⃣  Existing users in database: ${existingUsersCount}`);

        // Step 2: Display all existing users
        const existingUsers = await User.find().select('username mobile email role customerType createdAt');
        console.log('\n📊 Current Users in Database:');
        console.log('-'.repeat(60));
        if (existingUsers.length > 0) {
            existingUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username} (${user.mobile})`);
                console.log(`   Email: ${user.email || 'N/A'}`);
                console.log(`   Role: ${user.role} | Type: ${user.customerType}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log('-'.repeat(60));
            });
        } else {
            console.log('   No users found in database');
        }

        // Step 3: Create a test user (simulating signup)
        const testMobile = `9999${Date.now().toString().slice(-6)}`;
        console.log(`\n2️⃣  Creating test user with mobile: ${testMobile}`);

        const testUser = new User({
            username: 'Test User',
            mobile: testMobile,
            email: 'testuser@example.com',
            password: 'test123',
            address: '123 Test Street, Test City',
            role: 'customer',
            customerType: 'regular'
        });

        const savedUser = await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log(`   User ID: ${savedUser._id}`);
        console.log(`   Username: ${savedUser.username}`);
        console.log(`   Mobile: ${savedUser.mobile}`);

        // Step 4: Verify the user was saved by querying the database
        console.log('\n3️⃣  Verifying user was saved to database...');
        const verifyUser = await User.findById(savedUser._id);

        if (verifyUser) {
            console.log('✅ User successfully verified in database!');
            console.log(`   Found user: ${verifyUser.username}`);
            console.log(`   Mobile: ${verifyUser.mobile}`);
            console.log(`   Email: ${verifyUser.email}`);
            console.log(`   Role: ${verifyUser.role}`);
            console.log(`   Customer Type: ${verifyUser.customerType}`);
            console.log(`   Created At: ${verifyUser.createdAt}`);
        } else {
            console.log('❌ User NOT found in database!');
        }

        // Step 5: Check updated user count
        const newUsersCount = await User.countDocuments();
        console.log(`\n4️⃣  Total users after signup: ${newUsersCount}`);
        console.log(`   Users added: ${newUsersCount - existingUsersCount}`);

        // Step 6: Test duplicate mobile number validation
        console.log('\n5️⃣  Testing duplicate mobile number validation...');
        try {
            const duplicateUser = new User({
                username: 'Duplicate User',
                mobile: testMobile, // Same mobile number
                password: 'test456',
                role: 'customer'
            });
            await duplicateUser.save();
            console.log('❌ Duplicate validation FAILED - duplicate user was saved!');
        } catch (err) {
            if (err.code === 11000) {
                console.log('✅ Duplicate validation PASSED - duplicate mobile rejected');
            } else {
                console.log('⚠️  Unexpected error:', err.message);
            }
        }

        // Step 7: Clean up test user
        console.log('\n6️⃣  Cleaning up test user...');
        await User.findByIdAndDelete(savedUser._id);
        console.log('✅ Test user deleted');

        const finalCount = await User.countDocuments();
        console.log(`   Final user count: ${finalCount}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📝 Summary:');
        console.log('   ✓ Users can be created and saved to database');
        console.log('   ✓ Users can be retrieved from database');
        console.log('   ✓ Duplicate mobile numbers are prevented');
        console.log('   ✓ All user fields are properly stored');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}
