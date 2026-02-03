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

const ORDER_ID = '69819fb18d42df65118620ff';
const TALLY_URL = 'http://localhost:9000';

async function testSync() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');

    const order = await Order.findById(ORDER_ID).populate('items.product');
    const user = await User.findById(order.user);

    console.log('--- Syncing Masters ---');

    // 1. Sync Unit
    try {
        console.log('Pushing Unit [pcs]...');
        await axios.post(TALLY_URL, generateUnitXML(), { headers: { 'Content-Type': 'text/xml' } });
        console.log('✅ Unit Synced');
    } catch (e) { console.error('Unit Fail:', e.message); }

    // 2. Sync Sales Ledger
    try {
        console.log('Pushing Ledger [Sales Account]...');
        await axios.post(TALLY_URL, generateSalesLedgerXML(), { headers: { 'Content-Type': 'text/xml' } });
        console.log('✅ Sales Ledger Synced');
    } catch (e) { console.error('Sales Ledger Fail:', e.message); }

    // 3. Sync Customer Ledger
    try {
        console.log(`Pushing Ledger [${user.username}]...`);
        await axios.post(TALLY_URL, generateLedgerXML(user), { headers: { 'Content-Type': 'text/xml' } });
        console.log('✅ Customer Ledger Synced');
    } catch (e) { console.error('Ledger Fail:', e.message); }

    // 4. Sync Stock Item
    try {
        console.log(`Pushing Item [${order.items[0].product.title}]...`);
        const stockItemXML = generateStockItemXML(order.items[0].product);
        await axios.post(TALLY_URL, stockItemXML, { headers: { 'Content-Type': 'text/xml' } });
        console.log('✅ Stock Item Synced');
    } catch (e) { console.error('Stock Item Fail:', e.message); }

    // 5. Sync Voucher
    console.log('\n--- Sending Voucher XML ---');
    const voucherXML = generateSalesVoucherXML(order, user);

    try {
        const res = await axios.post(TALLY_URL, voucherXML, { headers: { 'Content-Type': 'text/xml' } });
        console.log('\n--- Tally Response ---');
        console.log(res.data);

        if (res.data.includes('<CREATED>1</CREATED>') || res.data.includes('<ALTERED>1</ALTERED>')) {
            console.log('✅ SUCCESS! Voucher Created!');
        } else {
            console.log('❌ Tally Rejected');
        }
    } catch (e) {
        console.error('Voucher Fail:', e.message);
    }

    process.exit();
}

testSync();
