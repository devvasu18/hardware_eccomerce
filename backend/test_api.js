const fetch = require('node-fetch'); // Needs node-fetch installed or use built-in fetch if Node 18+

// Assuming Node 18+ has global fetch
async function test() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '1234567890', password: '123456' })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        if (!loginRes.ok) {
            console.log('Login Failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Got Token length:', token.length);

        // 2. Fetch Order
        const orderId = '697221f8919638184e77c3fa';
        console.log(`Fetching Order ${orderId}...`);

        const orderRes = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orderJson = await orderRes.json();
        console.log('Order Status:', orderRes.status);
        console.log('Order Success:', orderJson.success);

        if (!orderJson.success) {
            console.log('Order Error Message:', orderJson.message);
        } else {
            console.log('Order Retrieved OK. Items count:', orderJson.order.items.length);
        }

    } catch (e) {
        console.error(e);
    }
}

test();
