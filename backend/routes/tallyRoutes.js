const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { generateSalesVoucherXML } = require('../utils/tallyXmlGenerator');
const { generateLedgerXML } = require('../utils/tallyLedgerGenerator');
const { syncWithHealthCheck } = require('../services/tallyService');

const TALLY_URL = 'http://localhost:9000'; // Kept for reference, but service handles this

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

        // Step 1: Sync Ledger (using new service)
        const { generateLedgerXML, generateSalesLedgerXML } = require('../utils/tallyLedgerGenerator');

        // 1a. Sync Sales Account (Common Ledger)
        await syncWithHealthCheck({
            xmlData: generateSalesLedgerXML(),
            type: 'Ledger',
            relatedId: user._id, // Use user ID conceptually or a static ID if available, but for now user ID keeps it simple
            relatedModel: 'User' // Tracking as user update technically
        });

        // 1b. Sync Customer Ledger
        const ledgerXML = generateLedgerXML(user);

        // We sync ledger first - but we don't block order sync if ledger fails 
        // (Tally might already have it, or it might be a connectivity issue which syncWithHealthCheck will handle)
        await syncWithHealthCheck({
            xmlData: ledgerXML,
            type: 'Ledger',
            relatedId: user._id, // User ID for ledger sync tracking
            relatedModel: 'User'
        });

        // Import Generator
        const { generateStockItemXML } = require('../utils/tallyStockItemGenerator');

        // Step 1.5: Sync Stock Items
        for (const item of order.items) {
            if (item.product) {
                const stockItemXML = generateStockItemXML(item.product);
                await syncWithHealthCheck({
                    xmlData: stockItemXML,
                    type: 'StockItem',
                    relatedId: item.product._id,
                    relatedModel: 'Product'
                });
            }
        }

        // Step 2: Sync Voucher (using new service)
        const voucherXML = generateSalesVoucherXML(order, user);

        const result = await syncWithHealthCheck({
            xmlData: voucherXML,
            type: 'SalesVoucher',
            relatedId: order._id,
            relatedModel: 'Order'
        });

        if (result.success) {
            return res.json({ success: true, message: 'Synced to Tally' });
        } else if (result.queued) {
            return res.json({ success: true, message: 'Tally offline/busy - Queued for background sync', queued: true });
        } else {
            // Hard failure (rejected by Tally logic, not network)
            return res.status(500).json({ success: false, message: result.error });
        }

    } catch (error) {
        console.error('Tally Sync System Error:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
