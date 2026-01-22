const axios = require('axios');

async function testAdminAccess() {
    try {
        // Step 1: Login as super admin
        console.log('Step 1: Logging in as super admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            mobile: '9999999999',
            password: '123456'
        });

        console.log('Login successful!');
        console.log('User data:', JSON.stringify(loginResponse.data.user, null, 2));
        console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');

        const token = loginResponse.data.token;

        // Step 2: Try to access /api/users
        console.log('\nStep 2: Accessing /api/users with token...');
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Success! Retrieved', usersResponse.data.length, 'users');
        console.log('Users:', usersResponse.data.map(u => `${u.username} (${u.role})`).join(', '));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAdminAccess();
