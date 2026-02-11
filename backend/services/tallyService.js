const axios = require('axios');
const crypto = require('crypto');
const TallySyncQueue = require('../models/TallySyncQueue');
const TallyStatusLog = require('../models/TallyStatusLog');
const Order = require('../models/Order');
const User = require('../models/User');
const { generateSalesVoucherXML } = require('../utils/tallyXmlGenerator');
const { generateLedgerXML, generateSalesLedgerXML, generateTaxLedgerXML, generatePurchaseLedgerXML } = require('../utils/tallyLedgerGenerator');
const { generateStockItemXML } = require('../utils/tallyStockItemGenerator');
const { generateUnitXML } = require('../utils/tallyUnitGenerator');
const SystemSettings = require('../models/SystemSettings');

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
                errorMessage: 'Sync Success',
                queueSuccess: 1
            });
            return { success: true, response: responseData, error: null };
        } else {
            // Try to extract error
            let errorMsg = 'Tally rejected the voucher';
            const errorMatch = responseData.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
            if (errorMatch) errorMsg = errorMatch[1];

            // Specific check for "Already Exists" to avoid queue loops
            // Tally errors: "Name already exists", "Duplicate entry", etc.
            if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('duplicate')) {
                await TallyStatusLog.create({
                    status: 'online',
                    errorMessage: `Ignored Duplicate: ${errorMsg}`,
                    queueSuccess: 1
                });
                return { success: true, response: responseData, error: null, warning: 'Already exists' };
            }

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
            } else if (queueItem.relatedModel === 'StockEntry') {
                // Determine model dynamically to avoid circular deps if possible or use require
                const StockEntry = require('../models/StockEntry');
                await StockEntry.findByIdAndUpdate(queueItem.relatedId, {
                    tallyStatus: 'saved',
                    tallyErrorLog: ''
                });
            } else if (queueItem.relatedModel === 'ProcurementRequest') {
                const ProcurementRequest = require('../models/ProcurementRequest');
                await ProcurementRequest.findByIdAndUpdate(queueItem.relatedId, {
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
                } else if (queueItem.relatedModel === 'StockEntry') {
                    const StockEntry = require('../models/StockEntry');
                    await StockEntry.findByIdAndUpdate(queueItem.relatedId, {
                        tallyStatus: 'failed',
                        tallyErrorLog: `Queue Failed: ${result.error}`
                    });
                } else if (queueItem.relatedModel === 'ProcurementRequest') {
                    const ProcurementRequest = require('../models/ProcurementRequest');
                    await ProcurementRequest.findByIdAndUpdate(queueItem.relatedId, {
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
        const settings = await SystemSettings.findById('system_settings');
        if (settings && settings.tallyIntegrationEnabled === false) {
            console.log('[Tally Sync] Processing skipped - Integration is disabled in settings');
            return { processed: 0, success: 0, failed: 0 };
        }

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
 * Add item to queue with Idempotency
 */
async function addToQueue({ payload, type, relatedId, relatedModel, isOnDemand = false }) {
    // Generate Hash
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

    // Check if duplicate hash exists (Idempotency)
    const existingHash = await TallySyncQueue.findOne({ payloadHash });
    if (existingHash) {
        console.log(`[Tally Sync] Ignored duplicate payload for ${relatedModel} ${relatedId}`);
        return existingHash;
    }

    // Check if duplicate pending by ID (Double safety)
    const existing = await TallySyncQueue.findOne({
        relatedId, relatedModel, status: { $in: ['pending', 'processing'] }
    });

    if (existing) return existing;

    return await TallySyncQueue.create({
        payload, payloadHash, type, relatedId, relatedModel, isOnDemand, status: 'pending'
    });
}

/**
 * Main Sync Entry Point: Checks health, then syncs or queues
 */
async function syncWithHealthCheck({ xmlData, type, relatedId, relatedModel }) {
    try {
        const settings = await SystemSettings.findById('system_settings');
        if (settings && settings.tallyIntegrationEnabled === false) {
            console.log(`[Tally Sync] Sync skipped for ${relatedModel} ${relatedId} - Integration is disabled`);
            return { success: false, error: 'Tally integration is disabled' };
        }

        const health = await checkTallyHealth();

        if (!health.online) {
            await addToQueue({ payload: xmlData, type, relatedId, relatedModel });

            // Mark order/stock as queued
            if (relatedModel === 'Order') {
                await Order.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued',
                    tallyErrorLog: 'Tally Offline - Queued'
                });
            } else if (relatedModel === 'StockEntry') {
                const StockEntry = require('../models/StockEntry');
                await StockEntry.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued',
                    tallyErrorLog: 'Tally Offline - Queued'
                });
            } else if (relatedModel === 'ProcurementRequest') {
                const ProcurementRequest = require('../models/ProcurementRequest');
                await ProcurementRequest.findByIdAndUpdate(relatedId, {
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
            } else if (relatedModel === 'StockEntry') {
                const StockEntry = require('../models/StockEntry');
                await StockEntry.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'saved',
                    tallyErrorLog: ''
                });
            } else if (relatedModel === 'ProcurementRequest') {
                const ProcurementRequest = require('../models/ProcurementRequest');
                await ProcurementRequest.findByIdAndUpdate(relatedId, {
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
            } else if (relatedModel === 'StockEntry') {
                const StockEntry = require('../models/StockEntry');
                await StockEntry.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued',
                    tallyErrorLog: `Sync Failed: ${result.error}. Retrying via queue.`
                });
            } else if (relatedModel === 'ProcurementRequest') {
                const ProcurementRequest = require('../models/ProcurementRequest');
                await ProcurementRequest.findByIdAndUpdate(relatedId, {
                    tallyStatus: 'queued',
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
        const order = await Order.findById(orderId).populate({
            path: 'items.product',
            populate: { path: 'hsn_code' }
        });
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
                type: 'Other', // Mapped to 'Other' as Unit is not a primary entity in our new enum
                relatedId: `UNIT-${unit}`,
                relatedModel: 'Unit'
            });
        }

        // 2. Sync Sales Ledger
        await syncWithHealthCheck({
            xmlData: generateSalesLedgerXML(),
            type: 'Other',
            relatedId: 'LEDGER-SALES',
            relatedModel: 'Ledger'
        });

        // 2b. Sync Tax Ledgers (CGST, SGST, IGST)
        const taxLedgers = ['CGST', 'SGST', 'IGST'];
        for (const tax of taxLedgers) {
            await syncWithHealthCheck({
                xmlData: generateTaxLedgerXML(tax, 'Duties & Taxes'),
                type: 'Other',
                relatedId: `LEDGER-${tax}`,
                relatedModel: 'Ledger'
            });
        }

        // 2c. Sync Round Off Ledger
        await syncWithHealthCheck({
            xmlData: generateTaxLedgerXML('Round Off', 'Indirect Expenses'),
            type: 'Other',
            relatedId: 'LEDGER-ROUNDOFF',
            relatedModel: 'Ledger'
        });

        // 3. Sync Customer Ledger
        await syncWithHealthCheck({
            xmlData: generateLedgerXML(user),
            type: 'Customer',
            relatedId: user._id,
            relatedModel: 'User'
        });

        // 4. Sync Stock Items
        for (const item of order.items) {
            if (item.product) {
                // Ensure unique ID for Tally Sync Queue if model/variation exists
                let uniqueRelatedId = item.product._id.toString();
                if (item.modelId) uniqueRelatedId += `-${item.modelId}`;
                if (item.variationId) uniqueRelatedId += `-${item.variationId}`;
                else if (item.variationText) uniqueRelatedId += `-${item.variationText.replace(/\s+/g, '-')}`;

                await syncWithHealthCheck({
                    xmlData: generateStockItemXML(item.product, item.variationText, item.modelName),
                    type: 'Product',
                    relatedId: uniqueRelatedId,
                    relatedModel: 'Product'
                });
            }
        }

        // 5. Sync Voucher (Check for Validity or Cancellation)
        // If order is Cancelled, we send an Alter request with ISCANCELLED=Yes
        const isCancelled = order.status === 'Cancelled';
        const voucherXML = generateSalesVoucherXML(order, user, isCancelled);

        return await syncWithHealthCheck({
            xmlData: voucherXML,
            type: 'Order',
            relatedId: order._id,
            relatedModel: 'Order'
        });

    } catch (error) {
        console.error('Auto-Sync Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Orchestrate the full Stock Entry Sync (Purchase)
 */
async function syncStockEntryToTally(stockEntryId) {
    try {
        const StockEntry = require('../models/StockEntry');
        const Party = require('../models/Party');
        const Product = require('../models/Product');
        const { generatePurchaseVoucherXML } = require('../utils/tallyPurchaseXmlGenerator');

        const stockEntry = await StockEntry.findById(stockEntryId);
        if (!stockEntry) return { success: false, error: 'Stock Entry not found' };

        const party = await Party.findById(stockEntry.party_id);
        if (!party) return { success: false, error: 'Party not found' };

        // Fetch associated ProductStock items
        const ProductStock = require('../models/ProductStock');
        const stockItems = await ProductStock.find({ stock_id: stockEntry._id }).populate('product_id');

        // Enhance items with model/variant names for XML generation
        const enhancedItems = [];
        for (const item of stockItems) {
            let modelName = '';
            let variantName = '';

            if (item.model_id || item.variant_id) {
                const product = item.product_id;
                if (item.model_id) {
                    const model = product.models.id(item.model_id);
                    if (model) modelName = model.name;
                }
                if (item.variant_id) {
                    // Search in model variations or root variations
                    let variant = null;
                    if (item.model_id) {
                        const model = product.models.id(item.model_id);
                        if (model) variant = model.variations.id(item.variant_id);
                    } else {
                        variant = product.variations.id(item.variant_id);
                    }
                    if (variant) variantName = variant.value;
                }
            }

            enhancedItems.push({
                product: item.product_id,
                product_name: item.product_id.title,
                model_name: modelName,
                variant_name: variantName,
                qty: item.qty,
                unit_price: item.unit_price,
                total: item.total_price
            });
        }

        const entryWithItems = { ...stockEntry.toObject(), items: enhancedItems };

        // 1. Sync Units (Assume 'pcs' for now or dynamic)
        await syncWithHealthCheck({
            xmlData: generateUnitXML('pcs'),
            type: 'Other',
            relatedId: 'UNIT-pcs',
            relatedModel: 'Unit'
        });

        // 2. Sync Purchase Ledgers
        await syncWithHealthCheck({
            xmlData: generatePurchaseLedgerXML(),
            type: 'Other',
            relatedId: 'LEDGER-PURCHASE',
            relatedModel: 'Ledger'
        });

        // 2b. Sync Tax Ledgers
        const taxLedgers = ['CGST', 'SGST', 'IGST'];
        for (const tax of taxLedgers) {
            await syncWithHealthCheck({
                xmlData: generateTaxLedgerXML(tax, 'Duties & Taxes'),
                type: 'Other',
                relatedId: `LEDGER-${tax}`,
                relatedModel: 'Ledger'
            });
        }

        // 3. Sync Supplier (Party) Ledger
        const partyUserLike = {
            username: party.name,
            mobile: party.phone_no,
            address: party.address,
            gstIn: party.gst_no,
            tallyLedgerName: party.phone_no ? `${party.name} - ${party.phone_no}` : party.name,
            tallyParentGroup: 'Sundry Creditors'
        };

        await syncWithHealthCheck({
            xmlData: generateLedgerXML(partyUserLike),
            type: 'Customer', // Technically supplier but sharing same enum/model often
            relatedId: party._id,
            relatedModel: 'Party'
        });

        // 4. Sync Stock Items
        for (const item of enhancedItems) {
            let uniqueRelatedId = item.product._id.toString();
            if (item.model_name) uniqueRelatedId += `-${item.model_name}`;
            if (item.variant_name) uniqueRelatedId += `-${item.variant_name}`;

            await syncWithHealthCheck({
                xmlData: generateStockItemXML(item.product, item.variant_name, item.model_name),
                type: 'Product',
                relatedId: uniqueRelatedId,
                relatedModel: 'Product'
            });
        }

        // 5. Sync Purchase Voucher
        const voucherXML = generatePurchaseVoucherXML(entryWithItems, party);

        return await syncWithHealthCheck({
            xmlData: voucherXML,
            type: 'StockEntry',
            relatedId: stockEntry._id,
            relatedModel: 'StockEntry'
        });

    } catch (error) {
        console.error('Stock Entry Sync Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync On-Demand Request (Memorandum)
 */
async function syncOnDemandToTally(requestId) {
    try {
        const ProcurementRequest = require('../models/ProcurementRequest');
        const Product = require('../models/Product');
        const { generateMemorandumVoucherXML } = require('../utils/tallyMemorandumXmlGenerator');

        const request = await ProcurementRequest.findById(requestId);
        if (!request) return { success: false, error: 'Request not found' };

        const product = await Product.findById(request.product);
        if (!product) return { success: false, error: 'Product not found' };

        // 1. Sync Customer Ledger (if name exists, else generic)
        if (request.customerContact && request.customerContact.name) {
            const contact = request.customerContact;
            const partyUserLike = {
                username: contact.name,
                mobile: contact.mobile,
                address: contact.address,
                tallyLedgerName: `${contact.name} - ${contact.mobile}`,
                tallyParentGroup: 'Sundry Debtors' // Treat as potential customer
            };

            await syncWithHealthCheck({
                xmlData: generateLedgerXML(partyUserLike),
                type: 'Customer',
                relatedId: `GUEST-${contact.mobile}`, // Pseudo-ID
                relatedModel: 'User'
            });
        }

        // 2. Sync Stock Item (Product)
        let uniqueRelatedId = product._id.toString();
        if (request.modelName) uniqueRelatedId += `-${request.modelName}`;
        if (request.variationText) uniqueRelatedId += `-${request.variationText.replace(/\s+/g, '-')}`;

        await syncWithHealthCheck({
            xmlData: generateStockItemXML(product, request.variationText, request.modelName),
            type: 'Product',
            relatedId: uniqueRelatedId,
            relatedModel: 'Product'
        });

        // 3. Sync Memorandum Voucher
        const voucherXML = generateMemorandumVoucherXML(request, product);

        return await syncWithHealthCheck({
            xmlData: voucherXML,
            type: 'OnDemand',
            relatedId: request._id,
            relatedModel: 'ProcurementRequest'
        });

    } catch (error) {
        console.error('OnDemand Sync Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Real-Time Stock Balance for a Single Item from Tally
 * Uses a targeted TDL query
 * @param {string} tallyItemName - The exact item name in Tally
 */
async function getRealTimeTallyStock(tallyItemName) {
    if (!tallyItemName) return null;

    const requestXML = `
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <DESC>
                <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                </STATICVARIABLES>
                <TDL>
                    <TDLMESSAGE>
                        <REPORT NAME="OneItemStock" ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No">
                            <FORMS>OneItemStockForm</FORMS>
                        </REPORT>
                        <FORM NAME="OneItemStockForm">
                            <TOPPARTS>OneItemStockPart</TOPPARTS>
                        </FORM>
                        <PART NAME="OneItemStockPart">
                            <TOPLINES>OneItemStockLine</TOPLINES>
                            <REPEAT>OneItemStockLine : Stock Item</REPEAT>
                            <SCROLLED>Vertical</SCROLLED>
                        </PART>
                        <LINE NAME="OneItemStockLine">
                            <LEFTFIELDS>Name Field</LEFTFIELDS>
                            <RIGHTFIELDS>Closing Balance Field</RIGHTFIELDS>
                        </LINE>
                        <FIELD NAME="Name Field">
                            <SET>$Name</SET>
                        </FIELD>
                        <FIELD NAME="Closing Balance Field">
                            <SET>$ClosingBalance</SET>
                        </FIELD>
                        
                        <COLLECTION NAME="Stock Item">
                            <TYPE>Stock Item</TYPE>
                            <FILTERS>FilterByName</FILTERS>
                        </COLLECTION>
                        
                         <SYSTEM TYPE="Formulae" NAME="FilterByName">
                             $Name = "${tallyItemName}"
                         </SYSTEM>
                    </TDLMESSAGE>
                </TDL>
            </DESC>
        </BODY>
    </ENVELOPE>`;

    try {
        const response = await axios.post(TALLY_URL, requestXML, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: 2000 // Fast Timeout (2s)
        });

        // Parse Response
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
        const result = await parser.parseStringPromise(response.data);

        // Navigate
        const stockItem = result['ENVELOPE']?.['BODY']?.['DATA']?.['TALLYMESSAGE']?.['STOCKITEM'];

        if (stockItem) {
            const closingBalanceStr = stockItem['CLOSINGBALANCE'];
            let quantity = parseFloat(closingBalanceStr?.split(' ')[0] || 0);
            if (isNaN(quantity)) quantity = 0;
            return quantity;
        }

        return null; // Item not found or zero

    } catch (error) {
        // console.error('RealTime Stock Check Error:', error.message);
        return null; // Fail Open (assume stock exists or rely on local)
    }
}

module.exports = {
    checkTallyHealth,
    sendToTally,
    processQueue,
    syncWithHealthCheck,
    addToQueue,
    syncOrderToTally,
    syncStockEntryToTally,
    syncOnDemandToTally,
    getRealTimeTallyStock
};
