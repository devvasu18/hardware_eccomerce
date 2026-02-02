const axios = require('axios');
const mongoose = require('mongoose');

// Config
const API_URL = 'http://localhost:5000/api';
const CONCURRENCY = 20; // Try to buy 20 times (more than stock)
const INITIAL_STOCK = 10;

// Colors for console
const red = '\x1b[31m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

async function runTest() {
    console.log('🚀 Starting Concurrency & Atomic Stock Test...');

    // 1. Setup: Create a temporary product with fixed stock using Admin API (or direct DB if easier, assuming local)
    // For this test to be black-box, we'd need admin login. 
    // Let's assume we can connect to DB directly for setup to be fast.

    // Connect DB
    await mongoose.connect('mongodb://localhost:27017/hardware_system');
    const Product = require('./models/Product');
    const Order = require('./models/Order');

    // Create Test Product
    const testProduct = await Product.create({
        title: "Stress Test Widget",
        slug: `stress-test-${Date.now()}`,
        category: new mongoose.Types.ObjectId(), // Fake ID
        mrp: 1000,
        selling_price_a: 500,
        stock: INITIAL_STOCK,
        gst_rate: 18,
        description: "Test Item",
        isActive: true
    });

    console.log(`📦 Created Test Product: ${testProduct.title} (ID: ${testProduct._id}) with Stock: ${INITIAL_STOCK}`);

    // 2. Prepare Requests
    // We need a dummy valid shipping address and item structure
    const orderPayload = {
        items: [{
            productId: testProduct._id.toString(),
            quantity: 1
        }],
        shippingAddress: "123 Test Lane, Gujarat",
        billingAddress: "123 Test Lane, Gujarat",
        paymentMethod: "COD",
        guestCustomer: {
            name: "Load Tester",
            phone: "9999999999",
            email: "test@example.com"
        }
    };

    console.log(`🔥 Firing ${CONCURRENCY} concurrent order requests...`);

    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        promises.push(
            axios.post(`${API_URL}/orders/create`, orderPayload)
                .then(res => ({ status: 'success', data: res.data }))
                .catch(err => ({ status: 'failed', error: err.response?.data || err.message }))
        );
    }

    // 3. Execute
    const results = await Promise.all(promises);

    // 4. Analyze
    const successes = results.filter(r => r.status === 'success');
    const failures = results.filter(r => r.status === 'failed');

    console.log('-'.repeat(50));
    console.log(`✅ Successful Orders: ${successes.length}`);
    console.log(`❌ Failed Orders:     ${failures.length}`);
    console.log('-'.repeat(50));

    // 5. Verify Database State
    const finalProduct = await Product.findById(testProduct._id);
    console.log(`🔍 Final DB Stock:    ${finalProduct.stock}`);

    // Assertions
    let passed = true;

    if (successes.length !== INITIAL_STOCK) {
        console.error(`${red}FAIL: Expected ${INITIAL_STOCK} successes, got ${successes.length}${reset}`);
        passed = false;
    }

    if (finalProduct.stock !== 0) {
        console.error(`${red}FAIL: Expected stock 0, got ${finalProduct.stock}${reset}`);
        passed = false;
    }

    if (finalProduct.stock < 0) {
        console.error(`${red}CRITICAL FAIL: Stock went negative! (${finalProduct.stock})${reset}`);
        passed = false;
    }

    // Cleanup
    await Product.deleteOne({ _id: testProduct._id });
    // await Order.deleteMany({ 'items.product': testProduct._id }); // Optional cleanup

    mongoose.connection.close();

    if (passed) {
        console.log(`${green}✨ TEST PASSED: Atomic locks are working correctly.${reset}`);
    } else {
        console.log(`${red}💀 TEST FAILED: Concurrency issues detected.${reset}`);
    }
}

runTest();
