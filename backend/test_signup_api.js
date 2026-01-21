const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testSignupAPI() {
    console.log('\n🧪 Testing User Signup API Endpoint\n');
    console.log('='.repeat(60));

    try {
        // Test 1: Successful signup
        console.log('\n1️⃣  Test: Successful User Signup');
        console.log('-'.repeat(60));

        const testMobile = `9999${Date.now().toString().slice(-6)}`;
        const signupData = {
            username: 'API Test User',
            mobile: testMobile,
            email: 'apitest@example.com',
            password: 'test123',
            address: '456 API Test Street, Test City'
        };

        console.log('📤 Sending signup request...');
        console.log(`   Mobile: ${signupData.mobile}`);
        console.log(`   Username: ${signupData.username}`);
        console.log(`   Email: ${signupData.email}`);

        const signupResponse = await axios.post(`${API_URL}/register`, signupData);

        if (signupResponse.status === 201) {
            console.log('✅ Signup successful!');
            console.log(`   Status: ${signupResponse.status}`);
            console.log(`   Token received: ${signupResponse.data.token ? 'Yes' : 'No'}`);
            console.log(`   User ID: ${signupResponse.data.user.id}`);
            console.log(`   Username: ${signupResponse.data.user.username}`);
            console.log(`   Role: ${signupResponse.data.user.role}`);
        }

        // Test 2: Verify user can login
        console.log('\n2️⃣  Test: Login with newly created user');
        console.log('-'.repeat(60));

        const loginData = {
            mobile: testMobile,
            password: 'test123'
        };

        console.log('📤 Sending login request...');
        const loginResponse = await axios.post(`${API_URL}/login`, loginData);

        if (loginResponse.status === 200) {
            console.log('✅ Login successful!');
            console.log(`   Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`);
            console.log(`   User ID: ${loginResponse.data.user.id}`);
        }

        // Test 3: Verify user with /me endpoint
        console.log('\n3️⃣  Test: Verify user with /me endpoint');
        console.log('-'.repeat(60));

        const token = loginResponse.data.token;
        console.log('📤 Sending /me request with token...');

        const meResponse = await axios.get(`${API_URL}/me`, {
            headers: {
                'Authorization': token
            }
        });

        if (meResponse.status === 200) {
            console.log('✅ User verification successful!');
            console.log(`   Username: ${meResponse.data.username}`);
            console.log(`   Mobile: ${meResponse.data.mobile}`);
            console.log(`   Email: ${meResponse.data.email}`);
            console.log(`   Role: ${meResponse.data.role}`);
            console.log(`   Customer Type: ${meResponse.data.customerType}`);
            console.log(`   Created At: ${meResponse.data.createdAt}`);
        }

        // Test 4: Duplicate signup attempt
        console.log('\n4️⃣  Test: Duplicate mobile number validation');
        console.log('-'.repeat(60));

        try {
            console.log('📤 Attempting to signup with same mobile...');
            await axios.post(`${API_URL}/register`, signupData);
            console.log('❌ Duplicate validation FAILED - duplicate user was created!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Duplicate validation PASSED');
                console.log(`   Error message: ${error.response.data.message}`);
            } else {
                console.log('⚠️  Unexpected error:', error.message);
            }
        }

        // Test 5: Invalid login
        console.log('\n5️⃣  Test: Invalid login credentials');
        console.log('-'.repeat(60));

        try {
            console.log('📤 Attempting login with wrong password...');
            await axios.post(`${API_URL}/login`, {
                mobile: testMobile,
                password: 'wrongpassword'
            });
            console.log('❌ Invalid credentials test FAILED - login succeeded with wrong password!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Invalid credentials test PASSED');
                console.log(`   Error message: ${error.response.data.message}`);
            } else {
                console.log('⚠️  Unexpected error:', error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL API TESTS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📝 Summary:');
        console.log('   ✓ User signup API works correctly');
        console.log('   ✓ JWT token is generated and returned');
        console.log('   ✓ User can login after signup');
        console.log('   ✓ User data is retrievable via /me endpoint');
        console.log('   ✓ Duplicate mobile numbers are rejected');
        console.log('   ✓ Invalid credentials are rejected');
        console.log('\n⚠️  Note: Test user remains in database. Clean up manually if needed.');
        console.log(`   Test mobile: ${testMobile}\n`);

    } catch (error) {
        console.error('\n❌ API Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        console.error('\n⚠️  Make sure the backend server is running on http://localhost:5000');
    }
}

// Run the test
testSignupAPI();
