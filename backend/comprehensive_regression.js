const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// CONFIGURATION
const API_URL = 'http://localhost:5000/api';
const DB_URI = process.env.MONGODB_URI;

// REPORT DATA
const report = {
    passing: [],
    regressions: [],
    inconsistencies: [],
    edgeFailures: [],
    securityStatus: 'UNKNOWN',
    confidenceScore: 100, // Starts at 100, deducted by failures
    recommendation: 'GO'
};

// UTILS
const log = (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`);
const success = (msg) => {
    console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
    report.passing.push(msg);
};
const fail = (msg, error, severity = 'HIGH') => {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
    if (error) {
        console.error(`  > Error: ${error.message}`);
        if (error.response && error.response.data) {
            console.error(`  > Response: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Deduct score
    let deduction = 0;
    if (severity === 'CRITICAL') deduction = 25;
    if (severity === 'HIGH') deduction = 10;
    if (severity === 'MEDIUM') deduction = 5;
    report.confidenceScore = Math.max(0, report.confidenceScore - deduction);

    report.regressions.push({ issue: msg, reason: error?.message || 'Unknown', severity });
};
const warn = (msg) => {
    console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`);
    report.inconsistencies.push(msg);
};

// GLOBAL VARS
let userToken = '';
let adminToken = '';
let userId = '';
let adminId = '';
let product1Id = '';
let product2Id = '';

async function runSuite() {
    log('🚀 STARTING COMPREHENSIVE REGRESSION SUITE');

    try {
        await mongoose.connect(DB_URI);
        log('Connected to Database');
    } catch (e) {
        fail('Database Connection', e, 'CRITICAL');
        return; // Cannot proceed
    }

    const User = require('./models/User');
    const Product = require('./models/Product');
    const Order = require('./models/Order');
    const Cart = require('./models/Cart');
    const Category = require('./models/Category');

    // ---------------------------------------------------------
    // SECTION 0: SETUP
    // ---------------------------------------------------------
    const timestamp = Date.now();
    const userEmail = `reg_user_${timestamp}@test.com`;
    const adminEmail = `reg_admin_${timestamp}@test.com`;
    const mobile = String(timestamp).slice(-10);

    // ---------------------------------------------------------
    // SECTION 1: CRITICAL USER FLOWS
    // ---------------------------------------------------------
    log('--- SECTION 1: CRITICAL USER FLOWS ---');

    // 1.1 Signup
    try {
        const res = await axios.post(`${API_URL}/auth/register`, {
            username: 'Regression User',
            email: userEmail,
            mobile: mobile,
            password: 'password123'
        });
        userId = res.data.user ? res.data.user._id : res.data._id; // Adjust based on actual API
        userToken = res.data.token;
        if (userToken) success('User Signup');
        else throw new Error('No token returned');
    } catch (e) {
        fail('User Signup Failed', e, 'CRITICAL');
        // Fallback: Create user manually so we can proceed
        try {
            const u = await User.create({
                username: 'Regression User',
                email: userEmail,
                mobile: mobile,
                password: 'password123'
            });
            userId = u._id;
            // Login to get token
            const login = await axios.post(`${API_URL}/auth/login`, { mobile: mobile, password: 'password123' });
            userToken = login.data.token;
            log('Use Manual User Creation + Login as Fallback');
        } catch (fe) {
            log('Fallback creation also failed: ' + fe.message);
        }
    }

    // 1.2 Login (Verify token works)
    if (userToken) {
        try {
            const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
            if (res.status === 200) success('User Verification (Me)');
        } catch (e) {
            fail('User Login Verification Failed', e, 'CRITICAL');
        }
    } else {
        warn('Skipping Login Check (No Token)');
    }

    // 1.3 Browse (Get Products)
    try {
        const res = await axios.get(`${API_URL}/products`); // Assume public
        if (res.data && (res.data.products || Array.isArray(res.data))) success('Browse Products');
        else throw new Error('Invalid product response format');
    } catch (e) {
        fail('Browse Products Failed', e, 'HIGH');
    }

    // Create Test Products (DIRECT DB) for consistence
    try {
        let cat = await Category.findOne({ slug: 'regression-test-cat' });
        if (!cat) {
            cat = await Category.create({
                name: `Reg Cat ${timestamp}`,
                slug: 'regression-test-cat',
                image: 'http://example.com/img.png'
            });
        }

        const p1 = await Product.create({
            title: `Reg Prod 1 ${timestamp}`,
            slug: `reg-prod-1-${timestamp}`,
            mrp: 1000,
            selling_price_a: 500,
            stock: 100,
            sku: `SKU1-${timestamp}`,
            isActive: true,
            category: cat._id
        });
        product1Id = p1._id;

        const p2 = await Product.create({
            title: `Reg Prod 2 ${timestamp}`,
            slug: `reg-prod-2-${timestamp}`,
            mrp: 2000,
            selling_price_a: 1500,
            stock: 10,
            sku: `SKU2-${timestamp}`,
            isActive: true,
            category: cat._id
        });
        product2Id = p2._id;
        log('Created Test Products directly in DB');
    } catch (e) {
        fail('Test Product Creation', e, 'CRITICAL');
    }

    // 1.4 Add to Cart
    if (userToken && product1Id) {
        try {
            await axios.post(`${API_URL}/cart/add`, {
                productId: product1Id,
                quantity: 2,
                price: 500 // VULNERABILITY: Price trusting client-side
            }, { headers: { Authorization: `Bearer ${userToken}` } });

            await axios.post(`${API_URL}/cart/add`, {
                productId: product2Id,
                quantity: 1,
                price: 1500
            }, { headers: { Authorization: `Bearer ${userToken}` } });

            success('Add to Cart');
        } catch (e) {
            fail('Add to Cart Failed', e, 'CRITICAL');
        }
    }

    // 1.5 Checkout (Create Order)
    let orderId = null;
    if (userToken) {
        try {
            // Fetch Cart items to send (Frontend Simulation)
            const cartRes = await axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${userToken}` } });
            let orderItems = [];
            if (cartRes.data && cartRes.data.items) {
                orderItems = cartRes.data.items.map(i => ({
                    productId: i.product._id || i.product,
                    quantity: i.quantity,
                    size: i.size
                }));
            }

            if (orderItems.length === 0) throw new Error('Cart empty before checkout?');

            const orderRes = await axios.post(`${API_URL}/orders/create`, {
                items: orderItems,
                shippingAddress: {
                    street: 'Test St',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '123456',
                    country: 'India'
                },
                billingAddress: {
                    street: 'Test St',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '123456',
                    country: 'India'
                },
                paymentMethod: 'COD'
            }, { headers: { Authorization: `Bearer ${userToken}` } });

            if (orderRes.data.order) {
                orderId = orderRes.data.order._id;
                success('Order Creation (Checkout)');
            } else {
                throw new Error('Order ID missing in response');
            }
        } catch (e) {
            try {
                if (e.response && e.response.status >= 400) {
                    // Retry with String Address
                    const cartRes = await axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${userToken}` } });
                    const retryItems = (cartRes.data.items || []).map(i => ({
                        productId: i.product._id || i.product,
                        quantity: i.quantity,
                        size: i.size
                    }));

                    const orderResRetry = await axios.post(`${API_URL}/orders/create`, {
                        items: retryItems,
                        shippingAddress: "Test Address String 123",
                        billingAddress: "Test Address String 123",
                        paymentMethod: 'COD'
                    }, { headers: { Authorization: `Bearer ${userToken}` } });
                    orderId = orderResRetry.data.order._id;
                    success('Order Creation (Checkout) - Retry with String Address');
                } else throw e;
            } catch (retryE) {
                fail('Checkout Failed', retryE, 'CRITICAL');
            }
        }
    }

    // ---------------------------------------------------------
    // SECTION 2: INVENTORY & STOCK REGRESSION
    // ---------------------------------------------------------
    log('--- SECTION 2: INVENTORY & STOCK ---');
    if (product1Id && product2Id) {
        try {
            const p1 = await Product.findById(product1Id);
            const p2 = await Product.findById(product2Id);

            // Logic: 100 - 2 = 98. 10 - 1 = 9.
            if (p1.stock === 98 && p2.stock === 9) {
                success('Stock Decrement Logic');
            } else {
                fail(`Stock Mismatch. Expected 98/9, Got ${p1.stock}/${p2.stock}`, null, 'CRITICAL');
            }
        } catch (e) {
            fail('Stock Validation Error', e, 'CRITICAL');
        }
    }

    // Test Out of Stock behavior
    try {
        const cat = await Category.findOne({ slug: 'regression-test-cat' });
        const pOut = await Product.create({
            title: `OOS Prod ${timestamp}`,
            slug: `oos-prod-${timestamp}`,
            mrp: 100,
            selling_price_a: 100,
            stock: 0,
            isActive: true,
            category: cat._id
        });

        if (userToken) {
            try {
                await axios.post(`${API_URL}/cart/add`, {
                    productId: pOut._id,
                    quantity: 1,
                    price: 100
                }, { headers: { Authorization: `Bearer ${userToken}` } });
                fail('Allowed adding OOS item to cart', null, 'HIGH');
            } catch (e) {
                if (e.response && e.response.status >= 400) success('Blocked OOS item add to cart');
                else fail('OOS Item Check failed with unexpected error', e, 'HIGH');
            }
        }
        await Product.deleteOne({ _id: pOut._id });
    } catch (e) {
        fail('OOS Logic Exception', e, 'MEDIUM');
    }


    // ---------------------------------------------------------
    // SECTION 4: CART BEHAVIOR (Post-Order)
    // ---------------------------------------------------------
    log('--- SECTION 4: CART POST-FIX ---');
    if (userToken) {
        try {
            // Cart should be empty after order
            const cartRes = await axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${userToken}` } });
            // Assuming cart returns items array
            const items = cartRes.data.items || cartRes.data.cart?.items || [];
            if (items.length === 0) {
                success('Cart Cleared After Order');
            } else {
                fail(`Cart NOT cleared. Items: ${items.length}`, null, 'HIGH');
            }
        } catch (e) {
            fail('Cart Validation Error', e, 'MEDIUM');
        }
    }


    // ---------------------------------------------------------
    // SECTION 5: SECURITY REGRESSION
    // ---------------------------------------------------------
    log('--- SECTION 5: SECURITY ---');

    // Create Admin User manually
    const adminMobile = String(timestamp + 1).slice(-10);
    try {
        const adminUser = await User.create({
            username: 'Reg Admin',
            email: adminEmail,
            // Password hashed by hook (which handles async/await now)
            password: 'password123',
            role: 'super_admin',
            mobile: adminMobile
        });
        adminId = adminUser._id;

        // Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: adminEmail,
            password: 'password123'
        });
        adminToken = loginRes.data.token;
        success('Admin Created & Logged In');
    } catch (e) {
        fail('Admin Setup Failed', e, 'HIGH');
    }

    // Test Admin Route Access with User Token
    if (adminToken && userToken) {
        try {
            // Pick an admin route, e.g., create category or get all users
            await axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${userToken}` } });
            fail('Security Breach: User accessed Admin Route', null, 'CRITICAL');
        } catch (e) {
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                success('Admin Route Protected');
                report.securityStatus = 'SECURE';
            } else {
                fail(`Admin Route Protection weak? Status: ${e.response?.status}`, e, 'HIGH');
            }
        }
    }


    // ---------------------------------------------------------
    // SECTION 6: ADMIN OPERATIONS
    // ---------------------------------------------------------
    log('--- SECTION 6: ADMIN OPS ---');
    if (adminToken && product1Id) {
        try {
            // Update Stock
            const updateRes = await axios.put(`${API_URL}/products/${product1Id}`, {
                stock: 500
            }, { headers: { Authorization: `Bearer ${adminToken}` } });

            if (updateRes.status === 200) {
                const pCheck = await Product.findById(product1Id);
                if (pCheck.stock === 500) success('Admin Product Update');
                else fail('Admin Update API returned 200 but DB not updated', null, 'HIGH');
            }
        } catch (e) {
            fail('Admin Product Update Failed', e, 'HIGH');
        }
    } else {
        warn('Skipping Admin Ops (No Token or Product)');
    }


    // ---------------------------------------------------------
    // SECTION 7: DATA INTEGRITY
    // ---------------------------------------------------------
    log('--- SECTION 7: DATA INTEGRITY ---');
    try {
        const orphanOrders = await Order.find({ user: null });
        if (orphanOrders.length === 0) success('No Orphaned Orders (User Ref)');
        else warn(`Found ${orphanOrders.length} orders without user reference`);

    } catch (e) {
        fail('Data Integrity Check Error', e, 'MEDIUM');
    }


    // ---------------------------------------------------------
    // SECTION 8: FAILURE SIMULATION (Logic)
    // ---------------------------------------------------------
    log('--- SECTION 8: FAILURE SIMULATION ---');
    try {
        // Simulate "Bad Request" to Order
        await axios.post(`${API_URL}/orders/create`, {
            items: [] // Empty
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        fail('Order Created with Empty Items', null, 'MEDIUM');
    } catch (e) {
        if (e.response && e.response.status === 400) success('Graceful Failure: Empty Order Rejected');
        else fail('Empty Order handling', e, 'LOW');
    }


    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    try {
        if (userId) await User.findByIdAndDelete(userId);
        if (adminId) await User.findByIdAndDelete(adminId);
        if (product1Id) await Product.findByIdAndDelete(product1Id);
        if (product2Id) await Product.findByIdAndDelete(product2Id);
        if (orderId) await Order.findByIdAndDelete(orderId);
        // Clean cart if exists
        try {
            if (userId) await Cart.deleteOne({ user: userId });
        } catch (ce) { }
        log('🧹 Cleanup Complete');
    } catch (e) {
        console.error('Cleanup Error:', e.message);
    }

    mongoose.disconnect();

    printReport();
}

function printReport() {
    console.log('\n\n==================================================');
    console.log('       POST-FIX REGRESSION REPORT');
    console.log('==================================================');

    console.log('\n1. PASSING FLOWS');
    report.passing.forEach(p => console.log(`   ✅ ${p}`));
    if (report.passing.length === 0) console.log('   (None)');

    console.log('\n2. REGRESSIONS FOUND');
    if (report.regressions.length === 0) console.log('   🎉 No Regressions Found');
    else report.regressions.forEach(r => console.log(`   ❌ [${r.severity}] ${r.issue}`));

    console.log('\n3. DATA INCONSISTENCIES');
    if (report.inconsistencies.length === 0) console.log('   ✅ None');
    else report.inconsistencies.forEach(i => console.log(`   ⚠️ ${i}`));

    console.log('\n4. EDGE CASE FAILURES');
    report.edgeFailures.forEach(e => console.log(`   ⚠️ ${e}`));
    if (report.edgeFailures.length === 0) console.log('   (None Tested/Found)');

    console.log(`\n5. SECURITY RECHECK STATUS: ${report.securityStatus}`);

    console.log(`\n6. PRODUCTION CONFIDENCE SCORE: ${report.confidenceScore}/100`);

    let recommendation = 'GO';
    if (report.confidenceScore < 90) recommendation = 'CAUTION';
    if (report.confidenceScore < 75) recommendation = 'NO-GO';
    console.log(`\n7. RECOMMENDATION: ${recommendation}`);
    console.log('==================================================\n');
}

runSuite();
