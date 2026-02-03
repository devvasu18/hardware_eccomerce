const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { generateSalesVoucherXML } = require('./utils/tallyXmlGenerator');
const { generateLedgerXML, generateSalesLedgerXML } = require('./utils/tallyLedgerGenerator');
const { generateStockItemXML } = require('./utils/tallyStockItemGenerator');
const { generateUnitXML } = require('./utils/tallyUnitGenerator');
require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

// USE THE SAME ORDER_ID AS LAST TEST TO SIMULATE UPDATE
const ORDER_ID = '69819fb18d42df65118620ff';
const TALLY_URL = 'http://localhost:9000';

async function testCancelSync() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');

    // 1. Fetch the Order to Cancel
    let order = await Order.findById(ORDER_ID).populate('items.product');
    const user = await User.findById(order.user);

    if (!order) { console.error('Order not found'); process.exit(1); }

    console.log(`--- Cancelling Order [${order._id}] ---`);
    console.log(`Original Status: ${order.status}`);

    // Simulate Status Change
    order.status = 'Cancelled';
    // We don't save back to DB in this script to keep data clean, but we use the object

    // 2. Generate Cancellation XML
    console.log('\n--- Generating Cancellation XML ---');
    const voucherXML = generateSalesVoucherXML(order, user, true); // true = IS Cancelled


    // 3. Send to Tally
    try {
        const res = await axios.post(TALLY_URL, voucherXML, { headers: { 'Content-Type': 'text/xml' } });
        console.log('\n--- Tally Response ---');
        console.log(res.data);

        if (res.data.includes('<CANCELLED>1</CANCELLED>') || res.data.includes('<ALTERED>1</ALTERED>')) {
            // Note: Tally sometimes says ALTERED=1 even for cancellation, check UI. 
            // Better: ISCANCELLED tag often treated as an Alteration that sets flag.
            console.log('✅ SUCCESS! Voucher Cancelled in Tally!');
        } else {
            console.log('❌ Tally Rejected Cancellation');
        }
    } catch (e) {
        console.error('Voucher Fail:', e.message);
    }

    process.exit();
}

testCancelSync();
