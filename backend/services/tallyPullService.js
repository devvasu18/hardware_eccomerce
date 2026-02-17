const axios = require('axios');
const xml2js = require('xml2js');
const crypto = require('crypto');
const TallySyncQueue = require('../models/TallySyncQueue');
const LastSyncLog = require('../models/LastSyncLog');
const Product = require('../models/Product');
const StockEntry = require('../models/StockEntry');
const Order = require('../models/Order');
const User = require('../models/User');

const TALLY_URL = process.env.TALLY_URL || 'http://localhost:9000/';
const TALLY_TIMEOUT = parseInt(process.env.TALLY_TIMEOUT) || 60000; // 60s for heavy pull

/**
 * Helper: Calculate Pending Stock from Web Queue
 * Returns map of { ProductID_ModelID_VariantID: Qty }
 */
async function getPendingWebStock() {
    const pendingMap = new Map();
    // Find all orders that are NOT synced to Tally yet
    // Meaning they exist in Web DB but Tally doesn't know about them.
    // Tally Status: 'pending', 'queued', 'failed' (if we retry)
    // AND Status is NOT Cancelled.

    // NOTE: If tallyStatus is 'saved', Tally KNOWS about it, so Tally Balance includes it.

    const pendingOrders = await Order.find({
        tallyStatus: { $ne: 'saved' },
        status: { $ne: 'Cancelled' }
    });

    for (const order of pendingOrders) {
        for (const item of order.items) {
            let key = item.product.toString();
            // Refine key matches Product Structure (We need to match the Tally Name logic)
            // But actually, we need to match the MongoDB Search Logic in processStockResponse.

            // Ideally we store simplified map:
            // Map<Product_ID, Qty>
            // Map<Product_ID + Model_ID, Qty>
            // Map<Product_ID + Variant_ID, Qty>
            // Map<Computed_Name, Qty> (Best)

            // Let's rely on standard ID for now and apply correction after finding product.
            // We will store Map<VariantSKU, Qty> AND Map<ProductID, Qty>

            if (item.product) {
                const qty = item.quantity || 1;

                // If item has SKU/Name, map it. 
                // We don't have the computed Tally Name here easily without re-running logic.
                // So we will store by Product/Variant ID and look it up inside the loop.

                // Key: "PROD_ID" or "PROD_ID:VAR_ID"
                let lookupKey = item.product.toString();
                if (item.variationId) lookupKey += `:${item.variationId}`;
                else if (item.modelId) lookupKey += `:${item.modelId}`;

                pendingMap.set(lookupKey, (pendingMap.get(lookupKey) || 0) + qty);
            }
        }
    }
    return pendingMap;
}

/**
 * Helper: Parse XML to JSON
 */
async function parseXML(xml) {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, mergeAttrs: true });
    try {
        return await parser.parseStringPromise(xml);
    } catch (error) {
        throw new Error('XML Parse Error: ' + error.message);
    }
}

/**
 * Helper: Get Last Sync Time
 */
async function getLastSyncTime(type) {
    const log = await LastSyncLog.findOne({ syncType: type }).sort({ lastSuccessfulSyncAt: -1 });
    // Default to 1990 if never synced (Tally standard)
    return log ? log.lastSuccessfulSyncAt : new Date('1990-01-01');
}

/**
 * Format Date for Tally (YYYYMMDD)
 */
function formatDateForTally(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Process Stock Response (Phase 1: Baseline)
 */
async function processStockResponse(xmlData) {
    const pendingStock = await getPendingWebStock();
    const parsed = await parseXML(xmlData);
    let stockItems = [];

    // Navigate messy XML structure
    try {
        const body = parsed['ENVELOPE']?.['BODY']?.['DATA']?.['TALLYMESSAGE'];
        if (body) {
            stockItems = Array.isArray(body) ? body : [body];
        } else {
            // Check alternative structure for Collection export
            const collection = parsed['ENVELOPE']?.['BODY']?.['IMPORTDATA']?.['REQUESTDATA']?.['TALLYMESSAGE'];
            if (collection) {
                stockItems = Array.isArray(collection) ? collection : [collection];
            }
        }
    } catch (e) {
        console.warn('Error navigating XML structure:', e);
    }

    let updatedCount = 0;
    let errors = [];

    for (const item of stockItems) {
        if (!item['STOCKITEM']) continue;

        const stockItem = item['STOCKITEM'];
        const name = stockItem['NAME']; // e.g., "Product Title - Model - Variant"
        const closingBalanceStr = stockItem['CLOSINGBALANCE']; // e.g., " -10.00 pcs" (Negative means Credit/Out in some contexts, but usually Tally sends net)

        // Parse Quantity: Remove string units and handle negative sign logic from Tally
        // Tally Closing Balance: Debit is Positive (Asset), Credit is Negative.
        // Usually Stock is Debit.
        let quantity = parseFloat(closingBalanceStr?.split(' ')[0] || 0);
        if (isNaN(quantity)) quantity = 0;

        // Try to find Product in MongoDB
        // Strategy 1: Match by Part Number (if stored in Tally Alias/Name)
        // Strategy 2: Match by Constructed Name

        // We will maintain a simple "Name Match" for now as per previous logic
        // "Title (Model) (Variant)"

        try {
            // Regex to parse: "Title (Model) (Variant)"
            // Use findOneAndUpdate with regex or specific logic

            // For Safety: We only update if we can identify the product uniquely.
            // Let's assume we store the Tally Name in 'part_number' or similar for now if we can,
            // or just iterate products.

            // Optimization: Update based on 'slug' if Tally Name contains slug? No.

            // Let's use the regex approach from the Prompt's "Stock Deduction" logic (reverse)
            // But here we need to find the PRODUCT.

            /*
               Logic:
               1. Find Product where title == name OR part_number == name OR generic match.
            */

            const product = await Product.findOne({
                $or: [
                    { title: name },
                    { part_number: name }, // Best check
                    { 'models.variations.sku': name },
                    { 'variations.sku': name }
                ]
            });

            if (product) {
                // Update total stock or specific variant stock?
                // If it matches a Variant SKU, update that variant.
                // If it matches Product Title, update root stock.

                let updated = false;

                // Check Models & Variants
                if (product.models && product.models.length > 0) {
                    let totalStock = 0;
                    for (let m of product.models) {
                        for (let v of m.variations) {
                            // Check if this variant matches the name
                            // Ideally Tally Name = SKU
                            if (v.sku === name || `${product.title} (${m.name}) (${v.value})` === name) {
                                v.stock = quantity;
                                updated = true;
                            }
                            totalStock += v.stock;
                        }
                    }
                    if (updated) {
                        // Update root stock as sum of variants if strict model-based
                        // logic suggests
                        // But if only one variant updated, do we recalcluate all?
                        // Ideally yes, but we only got info for THIS variant.
                        // So we trust the loop.
                    }
                }

                // Check Legacy Variations
                if (!updated && product.variations && product.variations.length > 0) {
                    for (let v of product.variations) {
                        if (v.sku === name || `${product.title} (${v.value})` === name) {
                            v.stock = quantity;
                            updated = true;
                        }
                    }
                }

                // If no variant matched (or it's a simple product), update root stock
                if (!updated) {
                    let pendingQty = pendingStock.get(product._id.toString()) || 0;
                    // Adjusted Stock = Tally Stock (Old) - Pending Web Orders (New)
                    // Wait, if Tally is 10, and we have 2 pending orders.
                    // True Stock is 8.
                    // So we SAVE 8 to MongoDB.

                    /*
                       EDGE CASE:
                       If Tally sends 10.
                       Web has 2 pending orders (sold).
                       We save 8.
                       Next sync: Tally still 10 (sync failed). Web still 2 pending. We save 8.
                       Sync succeeds: Tally becomes 8. Pending becomes 0.
                       Next sync: Tally sends 8. Pending 0. We save 8.
                       Correct.
                    */

                    const finalStock = Math.max(0, quantity - pendingQty);

                    if (pendingQty > 0) {
                        console.log(`[Stock Fix] Adjusted ${name} stock from ${quantity} to ${finalStock} due to ${pendingQty} pending orders.`);
                    }

                    product.stock = finalStock;
                }

                // ALSO apply fix for Variants if we found them
                if (updated && product.models) {
                    for (let m of product.models) {
                        for (let v of m.variations) {
                            if (v.sku === name || `${product.title} (${m.name}) (${v.value})` === name) {
                                // Look up pending for this variant
                                let variantKey = `${product._id}:${v._id}`;
                                let pendingQty = pendingStock.get(variantKey) || 0;

                                const finalStock = Math.max(0, quantity - pendingQty);
                                if (pendingQty > 0) {
                                    console.log(`[Stock Fix] Adjusted Variant ${v.value} stock from ${quantity} to ${finalStock}`);
                                }
                                v.stock = finalStock;
                            }
                        }
                    }
                } else if (updated && product.variations) {
                    for (let v of product.variations) {
                        if (v.sku === name || `${product.title} (${v.value})` === name) {
                            let variantKey = `${product._id}:${v._id}`;
                            let pendingQty = pendingStock.get(variantKey) || 0;

                            const finalStock = Math.max(0, quantity - pendingQty);
                            if (pendingQty > 0) console.log(`[Stock Fix] Adjusted Variant ${v.value} stock from ${quantity} to ${finalStock}`);
                            v.stock = finalStock;
                        }
                    }
                }

                await product.save();
                updatedCount++;
            }

        } catch (err) {
            errors.push(`Failed to update ${name}: ${err.message}`);
        }
    }

    return {
        success: true,
        count: updatedCount,
        errors: errors.length > 0 ? errors : null
    };
}

/**
 * Fetch Stock Closing Balances from Tally (Phase 1)
 */
async function fetchClosingBalances() {
    console.log('[Tally Sync] Starting Phase 1: Stock Reset...');

    // TDL to fetch Name + Closing Balance
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
                        <REPORT NAME="StockSummary" ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No">
                            <FORMS>Stock Summary</FORMS>
                        </REPORT>
                        <FORM NAME="Stock Summary">
                            <TOPPARTS>Stock Summary Part</TOPPARTS>
                        </FORM>
                        <PART NAME="Stock Summary Part">
                            <TOPLINES>Stock Summary Line</TOPLINES>
                            <REPEAT>Stock Summary Line : Stock Item</REPEAT>
                            <SCROLLED>Vertical</SCROLLED>
                        </PART>
                        <LINE NAME="Stock Summary Line">
                            <LEFTFIELDS>Name Field</LEFTFIELDS>
                            <RIGHTFIELDS>Closing Balance Field</RIGHTFIELDS>
                        </LINE>
                        <FIELD NAME="Name Field">
                            <SET>$Name</SET>
                        </FIELD>
                        <FIELD NAME="Closing Balance Field">
                            <SET>$ClosingBalance</SET>
                        </FIELD>
                    </TDLMESSAGE>
                </TDL>
            </DESC>
        </BODY>
    </ENVELOPE>`;

    try {
        const response = await axios.post(TALLY_URL, requestXML, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: TALLY_TIMEOUT
        });

        const result = await processStockResponse(response.data);

        await LastSyncLog.create({
            syncType: 'STOCK',
            lastSuccessfulSyncAt: new Date(),
            status: result.errors ? 'PARTIAL' : 'SUCCESS',
            itemsProcessed: result.count,
            errorLog: result.errors ? JSON.stringify(result.errors) : null,
            checksum: crypto.createHash('md5').update(response.data).digest('hex')
        });

        return result;

    } catch (error) {
        console.error('[Tally Sync] Stock Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Modified Vouchers (Phase 2: Incremental)
 */
async function fetchModifiedVouchers() {
    console.log('[Tally Sync] Starting Phase 2: Incremental Voucher Sync...');

    const lastSync = await getLastSyncTime('VOUCHER');
    const fromDate = formatDateForTally(lastSync);
    const toDate = formatDateForTally(new Date()); // Today

    // Request Vouchers Modified since last sync
    // Requires TDL modification to filter by Date Modified OR using generic Date Range
    // Standard Tally XML Export supports SVFROMDATE / SVTODATE

    const requestXML = `
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <DESC>
                <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                    <SVFROMDATE>${fromDate}</SVFROMDATE>
                    <SVTODATE>${toDate}</SVTODATE>
                </STATICVARIABLES>
            </DESC>
            <REPORTNAME>Vouchers</REPORTNAME>
        </BODY>
    </ENVELOPE>`;

    try {
        const response = await axios.post(TALLY_URL, requestXML, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: TALLY_TIMEOUT
        });

        const parsed = await parseXML(response.data);
        // Tally response structure for Vouchers varies.
        // Typically inside TALLYMESSAGE -> VOUCHER
        const messages = parsed['ENVELOPE']?.['BODY']?.['IMPORTDATA']?.['REQUESTDATA']?.['TALLYMESSAGE'] || [];
        const msgList = Array.isArray(messages) ? messages : [messages];

        let processedCount = 0;
        let requiresStockSync = false;

        for (const msg of msgList) {
            if (msg.VOUCHER) {
                // Found a voucher
                requiresStockSync = true;
                processedCount++;
            }
        }

        // Since we cannot 100% reliably parse Deltas without a robust schema,
        // We recommend flagging a "Stock Refresh Needed" or running a quick check.
        // For this implementation, we will log the count.

        if (requiresStockSync) {
            console.log(`[Tally Sync] Detected ${processedCount} modified vouchers. Triggering Stock Check.`);
            // Trigger stock sync to be safe
            await fetchClosingBalances();
        }

        await LastSyncLog.create({
            syncType: 'VOUCHER',
            lastSuccessfulSyncAt: new Date(),
            status: 'SUCCESS',
            itemsProcessed: processedCount,
            checksum: crypto.createHash('md5').update(response.data).digest('hex')
        });

        return { success: true, count: processedCount };

    } catch (error) {
        if (error.code === 'ECONNREFUSED' || (error.cause && error.cause.code === 'ECONNREFUSED')) {
            console.warn('[Tally Sync] Tally server not reachable (ECONNREFUSED). Is Tally running?');
            return { success: false, error: 'Tally unreachable' };
        }
        console.error('[Tally Sync] Voucher Error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    fetchClosingBalances,
    fetchModifiedVouchers
};
