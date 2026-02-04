const axios = require('axios');
const TallySyncQueue = require('../models/TallySyncQueue');
const TallyStatusLog = require('../models/TallyStatusLog');
const Order = require('../models/Order');
const User = require('../models/User');
const { generateSalesVoucherXML } = require('../utils/tallyXmlGenerator');
const { generateLedgerXML, generateSalesLedgerXML } = require('../utils/tallyLedgerGenerator');
const { generateStockItemXML } = require('../utils/tallyStockItemGenerator');
const { generateUnitXML } = require('../utils/tallyUnitGenerator');

// Use env var or default to localhost:9000
const TALLY_URL = process.env.TALLY_URL || 'http://localhost:9000/';
const TALLY_TIMEOUT = parseInt(process.env.TALLY_TIMEOUT) || 3000;

/**
 * Check if Tally server is online
 */
async function checkTallyHealth() {
    const startTime = Date.now();
    // Simple export request to check connectivity
    const testXML = '<ENVELOPE><HEADER><TALLYREQUEST>Export</TALLYREQUEST></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>';

    try {
        const response = await axios.post(TALLY_URL, testXML, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: TALLY_TIMEOUT
        });

        const responseTime = Date.now() - startTime;
        return { online: true, responseTime, error: null };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            online: false,
            responseTime,
            error: error.code === 'ECONNREFUSED' ? 'Tally server not reachable' : error.message
        };
    }
}

/**
 * Send XML to Tally
 */
async function sendToTally(xmlData) {
    try {
        const response = await axios.post(TALLY_URL, xmlData, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: TALLY_TIMEOUT * 2
        });

        const responseData = response.data;

        // Basic check for success response in Tally XML
        if (responseData.includes('<CREATED>1</CREATED>') || responseData.includes('<ALTERED>1</ALTERED>')) {
            // Log Success
            await TallyStatusLog.create({
                status: 'online',
                errorMessage: 'Sync Success', // Using errorMessage field for success info to show in existing UI logs
                queueSuccess: 1
            });
            return { success: true, response: responseData, error: null };
        } else {
            // Try to extract error
            let errorMsg = 'Tally rejected the voucher';
            const errorMatch = responseData.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
            if (errorMatch) errorMsg = errorMatch[1];

            // Log Failure
            await TallyStatusLog.create({
                status: 'online',
                errorMessage: `Rejected: ${errorMsg}`,
                queueFailed: 1
            });

            return { success: false, response: responseData, error: errorMsg };
        }
    } catch (error) {
        return { success: false, response: null, error: error.message };
    }
}

/**
 * Process a single queue item
 */
async function processQueueItem(queueItem) {
    try {
        queueItem.status = 'processing';
        await queueItem.save();

        const result = await sendToTally(queueItem.payload);

        if (result.success) {
            queueItem.status = 'synced';
            queueItem.syncedAt = new Date();
            queueItem.tallyResponse = result.response;
            queueItem.lastError = null;
            await queueItem.save();

            // If it's an Order, update the Order status too
            if (queueItem.relatedModel === 'Order') {
                await Order.findByIdAndUpdate(queueItem.relatedId, {
                    tallyStatus: 'saved',
                    tallyErrorLog: ''
                });
            }

            return true;
        } else {
            queueItem.retryCount += 1;
            queueItem.lastError = result.error;

            if (queueItem.retryCount >= queueItem.maxRetries) {
                queueItem.status = 'failed';
                // Update Order if failed permanently
                if (queueItem.relatedModel === 'Order') {
                    await Order.findByIdAndUpdate(queueItem.relatedId, {
                        tallyStatus: 'failed',
                        tallyErrorLog: `Queue Failed: ${result.error}`
                    });
                }
            } else {
                queueItem.status = 'pending'; // Retry later
            }

            await queueItem.save();
            return false;
        }
    } catch (error) {
        console.error('Queue Processing Error:', error);
        queueItem.status = 'pending';
        queueItem.lastError = error.message;
        await queueItem.save();
        return false;
    }
}

/**
 * Process pending queue items
 */
async function processQueue() {
    try {
        const pendingItems = await TallySyncQueue.find({ status: 'pending' })
            .sort({ createdAt: 1 })
            .limit(50);

        let successCount = 0;
        let failedCount = 0;

        for (const item of pendingItems) {
            const success = await processQueueItem(item);
            if (success) successCount++;
            else failedCount++;

            // Short delay
            await new Promise(r => setTimeout(r, 500));
        }

        return { processed: pendingItems.length, success: successCount, failed: failedCount };
    } catch (error) {
        console.error('Error processing queue:', error);
        return { processed: 0, success: 0, failed: 0 };
    }
}

/**
 * Add item to queue
 */
async function addToQueue({ payload, type, relatedId, relatedModel }) {
    // Check if duplicate pending
    const existing = await TallySyncQueue.findOne({
        relatedId, relatedModel, status: { $in: ['pending', 'processing'] }
    });

    if (existing) return existing;

    return await TallySyncQueue.create({
        payload, type, relatedId, relatedModel, status: 'pending'
    });
}

/**
 * Main Sync Entry Point: Checks health, then syncs or queues
 */
async function syncWithHealthCheck({ xmlData, type, relatedId, relatedModel }) {
    try {
        const health = await checkTallyHealth();

        if (!health.online) {
            await addToQueue({ payload: xmlData, type, relatedId, relatedModel });

            // Mark order as queued
            if (relatedModel === 'Order') {
                await Order.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued',
                    tallyErrorLog: 'Tally Offline - Queued'
                });
            }

            return { success: false, queued: true, error: 'Tally offline - queued' };
        }

        // Tally is online, try sync
        const result = await sendToTally(xmlData);

        if (result.success) {
            if (relatedModel === 'Order') {
                await Order.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'saved',
                    tallyErrorLog: ''
                });
            }
            return { success: true, queued: false };
        } else {
            // Failed, add to queue
            await addToQueue({ payload: xmlData, type, relatedId, relatedModel });

            if (relatedModel === 'Order') {
                await Order.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued', // Use queued instead of failed so it retries
                    tallyErrorLog: `Sync Failed: ${result.error}. Retrying via queue.`
                });
            }

            return { success: false, queued: true, error: result.error };
        }

    } catch (error) {
        await addToQueue({ payload: xmlData, type, relatedId, relatedModel });
        return { success: false, queued: true, error: error.message };
    }
}

/**
 * Orchestra the full Order Sync (Units > Ledgers > Stock > Voucher)
 */
async function syncOrderToTally(orderId) {
    try {
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) return { success: false, error: 'Order not found' };

        // Prevent duplicate sync if already saved, UNLESS it is a Cancellation update
        if (order.tallyStatus === 'saved' && order.status !== 'Cancelled') {
            return { success: true, message: 'Already synced' };
        }

        const user = await User.findById(order.user);
        if (!user) return { success: false, error: 'User not found' };

        // 1. Sync Units (Dynamic)
        const uniqueUnits = [...new Set(order.items.map(i => i.product?.unit || 'pcs'))];

        for (const unit of uniqueUnits) {
            await syncWithHealthCheck({
                xmlData: generateUnitXML(unit),
                type: 'Unit',
                relatedId: `UNIT-${unit}`,
                relatedModel: 'Unit'
            });
        }

        // 2. Sync Sales Ledger
        await syncWithHealthCheck({
            xmlData: generateSalesLedgerXML(),
            type: 'Ledger',
            relatedId: 'LEDGER-SALES',
            relatedModel: 'Ledger'
        });

        // 3. Sync Customer Ledger
        await syncWithHealthCheck({
            xmlData: generateLedgerXML(user),
            type: 'Ledger',
            relatedId: user._id,
            relatedModel: 'User'
        });

        // 4. Sync Stock Items
        for (const item of order.items) {
            if (item.product) {
                // Ensure unique ID for Tally Sync Queue if variation exists
                const uniqueRelatedId = item.variationText
                    ? `${item.product._id}-${item.variationText.replace(/\s+/g, '-')}`
                    : item.product._id;

                await syncWithHealthCheck({
                    xmlData: generateStockItemXML(item.product, item.variationText),
                    type: 'StockItem',
                    relatedId: uniqueRelatedId,
                    relatedModel: 'Product' // We keep model as Product, but ID is composite
                });
            }
        }

        // 5. Sync Voucher (Check for Validity or Cancellation)
        // If order is Cancelled, we send an Alter request with ISCANCELLED=Yes
        const isCancelled = order.status === 'Cancelled';
        const voucherXML = generateSalesVoucherXML(order, user, isCancelled);

        return await syncWithHealthCheck({
            xmlData: voucherXML,
            type: 'SalesVoucher',
            relatedId: order._id,
            relatedModel: 'Order'
        });

    } catch (error) {
        console.error('Auto-Sync Error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    checkTallyHealth,
    sendToTally,
    processQueue,
    syncWithHealthCheck,
    addToQueue,
    syncOrderToTally
};
