const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Config
const API_URL = 'http://localhost:5000/api';

// Colors
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

// Utilities
const log = (msg) => console.log(`${green}[TEST] ${msg}${reset}`);
const error = (msg) => console.log(`${red}[FAIL] ${msg}${reset}`);
const warn = (msg) => console.log(`${yellow}[WARN] ${msg}${reset}`);

async function runRegressionSuite() {
    console.log('🚀 Starting POST-FIX REGRESSION TEST SUITE...');

    // Connect to DB (Use Atlas URI from .env)
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        error('MONGODB_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(dbUri);
        log('Connected to MongoDB Atlas');
    } catch (err) {
        error(`DB Connection Failed: ${err.message}`);
        process.exit(1);
    }

    const User = require('./models/User');
    const Order = require('./models/Order');
    const Product = require('./models/Product');
    const BlacklistedToken = require('./models/BlacklistedToken');

    const timestamp = Date.now();
    const uniqueEmail = `qa_test_${timestamp}@example.com`;
    const uniqueMobile = String(timestamp).slice(-10);

    let token = '';
    let userId = '';
    let testProductId = '';

    try {
        // --- SECTION 1: CRITICAL USER FLOW & SECURITY ---
        log('1. Testing User Registration & Privilege Escalation...');
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                username: 'QA Tester',
                email: uniqueEmail,
                mobile: uniqueMobile,
                password: 'password123',
                role: 'super_admin' // ATTEMPT EXPLOIT
            });

            // Handle different possible response structures
            userId = regRes.data._id || (regRes.data.user ? regRes.data.user._id : null);
            token = regRes.data.token;

            if (!userId) throw new Error('Registration failed to return User ID');

            // Verify Role in DB
            const userInDb = await User.findOne({ email: uniqueEmail });
            if (userInDb.role === 'customer') {
                log('✅ Security Pass: Role forced to customer despite malicious payload.');
            } else {
                error(`❌ Security Fail: Role is ${userInDb.role}`);
                throw new Error('Privilege Escalation Failed');
            }
        } catch (regErr) {
            // Need to handle if user already exists or other errors
            throw new Error(`Registration Request Failed: ${regErr.response?.data?.message || regErr.message}`);
        }

        // --- SECTION 2: PROFILE & AUTH ---
        log('2. Testing Profile Update...');
        try {
            const updateRes = await axios.put(`${API_URL}/auth/profile`, {
                username: 'QA Tester Updated'
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (updateRes.data.username === 'QA Tester Updated') {
                log('✅ Profile Update Pass: Username changed.');
            } else {
                error('❌ Profile Update Fail');
            }
        } catch (profErr) {
            error(`Profile Update Failed: ${profErr.message}`);
        }

        // --- SECTION 3: INVENTORY & ORDER LOGIC ---
        log('3. Testing Order Creation, Stock, and Tax Logic...');

        // Create Temp Product directly in DB to bypass needing admin auth for this test setup
        const prod = await Product.create({
            title: `QA Widget ${timestamp}`,
            slug: `qa-widget-${timestamp}`,
            mrp: 1000,
            selling_price_a: 100, // Explicit Selling Price
            stock: 50,
            gst_rate: 18,
            category: new mongoose.Types.ObjectId(), // Fake
            isActive: true
        });
        testProductId = prod._id;

        // Place Order (Inter-State Logic Check -> Gujarat Address vs Non-Gujarat)
        // Let's use NON-Gujarat to test IGST
        try {
            const orderRes = await axios.post(`${API_URL}/orders/create`, {
                items: [{ productId: prod._id, quantity: 2 }],
                shippingAddress: "456 Mumbai, Maharashtra", // Inter-state
                billingAddress: "456 Mumbai, Maharashtra",
                paymentMethod: "COD"
            }, { headers: { Authorization: `Bearer ${token}` } });

            const orderId = orderRes.data.order._id;
            log(`Created Order: ${orderId}`);

            // Verify Invoice Number
            const dbOrder = await Order.findById(orderId);
            if (dbOrder.invoiceNumber && dbOrder.invoiceNumber.startsWith('INV-')) {
                log(`✅ Invoice Logic Pass: Generated ${dbOrder.invoiceNumber}`);
            } else {
                error('❌ Invoice Logic Fail: No invoice number generated');
            }

            // Verify Tax Logic (Inter-state should have IGST)
            // Access items properly (might be mongoose object or POJO)
            const item = dbOrder.items[0];
            if (item.igst > 0 && (!item.cgst || item.cgst === 0)) {
                log(`✅ Tax Logic Pass: IGST applied for Maharashtra (${item.igst}), CGST/SGST is 0.`);
            } else {
                error(`❌ Tax Logic Fail: IGST:${item.igst}, CGST:${item.cgst}, SGST:${item.sgst}`);
            }

            // Verify Stock Deduction
            const dbProduct = await Product.findById(prod._id);
            if (dbProduct.stock === 48) {
                log('✅ Stock Logic Pass: Stock deducted correctly from 50 to 48.');
            } else {
                error(`❌ Stock Logic Fail: Stock is ${dbProduct.stock}`);
            }
        } catch (ordErr) {
            throw new Error(`Order Creation Failed: ${ordErr.response?.data?.message || ordErr.message}`);
        }

        // --- SECTION 4: LOGOUT SECURITY ---
        log('4. Testing Secure Logout...');
        await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Verify Token Blacklist
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            log('✅ Logout Pass: Token found in blacklist.');
        } else {
            error('❌ Logout Fail: Token not blacklisted in DB.');
        }

        // Try to use old token
        try {
            await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            error('❌ Security Fail: Old token still works after logout!');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                log('✅ Security Pass: Old token rejected (401).');
            } else {
                warn(`⚠️ Unexpected response status: ${err.response?.status}`);
            }
        }

    } catch (err) {
        error(`CRITICAL FAILURE IN SUITE: ${err.message}`);
        console.error(err);
    } finally {
        // Cleanup
        if (userId) await User.deleteOne({ _id: userId });
        if (testProductId) await Product.deleteOne({ _id: testProductId });
        console.log('🧹 Cleanup complete.');
        mongoose.disconnect();
    }
}

runRegressionSuite();
