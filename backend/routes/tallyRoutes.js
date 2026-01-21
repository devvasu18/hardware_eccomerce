const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const { generateSalesVoucherXML } = require('../utils/tallyXmlGenerator');
const { generateLedgerXML } = require('../utils/tallyLedgerGenerator');

const TALLY_URL = 'http://localhost:9000';

// Sync Sales Invoice
router.post('/sales/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Prevent duplicate sync if already saved
        if (order.tallyStatus === 'saved') {
            return res.status(400).json({ message: 'Order already synced to Tally' });
        }

        const user = await User.findById(order.user);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Step 1: Sync Ledger
        const ledgerXML = generateLedgerXML(user);
        try {
            await axios.post(TALLY_URL, ledgerXML, { headers: { 'Content-Type': 'text/xml' } });
            console.log('Ledger synced successfully');
        } catch (ledgerError) {
            console.error('Tally Ledger Sync Error:', ledgerError.message);
            // We continue even if ledger sync fails, Tally might reject if exists (which is fine), or fail connection
            // If connection fail, next step will also fail
        }

        // Step 2: Sync Voucher
        const voucherXML = generateSalesVoucherXML(order, user);
        const response = await axios.post(TALLY_URL, voucherXML, { headers: { 'Content-Type': 'text/xml' } });

        const responseData = response.data;

        // Check Tally Response (Parsing XML response ideally, simple check here)
        if (responseData.includes('<CREATED>1</CREATED>') || responseData.includes('<ALTERED>1</ALTERED>')) {
            order.tallyStatus = 'saved';
            order.tallyErrorLog = '';
            await order.save();
            return res.json({ success: true, message: 'Synced to Tally' });
        } else {
            // Extract error if possible
            order.tallyStatus = 'failed';
            order.tallyErrorLog = responseData; // Save raw response for debug
            await order.save();
            return res.status(500).json({ success: false, message: 'Tally rejected data', data: responseData });
        }

    } catch (error) {
        console.error('Tally Sync System Error:', error);
        // Handle Network Error as "Queued" or "Failed"
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            // Here we would ideally add to a retry queue
            // For now, mark as failed so admin sees it
            try {
                await Order.findByIdAndUpdate(req.params.id, {
                    tallyStatus: 'failed',
                    tallyErrorLog: 'Tally Unreachable: ' + error.message
                });
            } catch (e) { }
        }
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
