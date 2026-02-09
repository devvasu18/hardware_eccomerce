const StockEntry = require('../models/StockEntry');
const ProductStock = require('../models/ProductStock');
const Product = require('../models/Product');
const crypto = require('crypto');

// Generate Invoice Number
const generateInvoiceNo = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `INV-${date}-${random}`;
};

// @desc    Create Stock Entry (Headers + Items)
// @route   POST /api/admin/stock
// @access  Admin
exports.createStockEntry = async (req, res) => {
    // Note: Mongoose transactions require a replica set. 
    // Assuming standalone for dev, we'll do sequential operations. 
    // In production with Atlas, wrap in session.

    try {
        const { party_id, bill_date, items, cgst, sgst } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in stock entry' });
        }

        // 1. Calculate totals
        let final_bill_amount_without_tax = 0;
        items.forEach(item => {
            final_bill_amount_without_tax += (item.qty * item.unit_price);
        });

        const final_bill_amount = final_bill_amount_without_tax + (cgst || 0) + (sgst || 0);
        const invoice_no = generateInvoiceNo();

        // 2. Create Header
        const stockEntry = new StockEntry({
            party_id,
            invoice_no,
            bill_date: bill_date || new Date(),
            final_bill_amount,
            final_bill_amount_without_tax,
            cgst,
            sgst
        });

        const savedEntry = await stockEntry.save();

        // 3. Create Line Items & Update Product Stock
        const productStockPromises = items.map(async (item) => {
            // Create Ledger Entry
            await ProductStock.create({
                stock_id: savedEntry._id,
                product_id: item.product_id,
                model_id: item.model_id || null,
                variant_id: item.variant_id || null,
                party_id,
                stock_type: 'in',
                qty: item.qty,
                unit_price: item.unit_price,
                total_price: item.qty * item.unit_price
            });

            // Update Product Stock
            if (item.model_id && item.variant_id) {
                // Update Model Variant Stock
                await Product.updateOne(
                    { _id: item.product_id },
                    { $inc: { "models.$[m].variations.$[v].stock": item.qty } },
                    { arrayFilters: [{ "m._id": item.model_id }, { "v._id": item.variant_id }] }
                );
            } else if (item.variant_id) {
                // Update Root Variant Stock
                await Product.updateOne(
                    { _id: item.product_id, "variations._id": item.variant_id },
                    { $inc: { "variations.$.stock": item.qty } }
                );
            } else {
                // Update Simple Product Stock (Legacy/Root)
                await Product.findByIdAndUpdate(item.product_id, {
                    $inc: { stock: item.qty, opening_stock: item.qty }
                });
            }
        });

        await Promise.all(productStockPromises);

        // Sync to Tally (Async - Don't block response)
        const tallyService = require('../services/tallyService');
        tallyService.syncStockEntryToTally(savedEntry._id).catch(err => {
            console.error('Tally Sync Error for Stock Entry:', err);
        });

        res.status(201).json(savedEntry);

    } catch (error) {
        console.error("Stock Entry Error", error);
        res.status(500).json({ message: 'Failed to create stock entry', error: error.message });
    }
};

// @desc    Get Stock Entries List
// @route   GET /api/admin/stock
// @access  Admin
exports.getStockEntries = async (req, res) => {
    try {
        const entries = await StockEntry.find({})
            .populate('party_id', 'name')
            .sort({ bill_date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stock entries', error: error.message });
    }
};

// @desc    Get Product Ledger
// @route   GET /api/admin/stock/ledger
// @access  Admin
exports.getProductLedger = async (req, res) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const ledger = await ProductStock.find({ product_id })
            .populate('stock_id', 'invoice_no bill_date')
            .populate('party_id', 'name')
            .sort({ createdAt: -1 });

        // Calculate aggregate
        const product = await Product.findById(product_id).select('opening_stock title');

        let totalIn = 0;
        let totalOut = 0;

        // This ledger query might need to be more complex to encompass ALL movement (like Sales Orders)
        // For now, this only tracks "Stock Entries" (Purchases). 
        // We will sum purely based on this table for the 'Ledger View' requested.

        ledger.forEach(entry => {
            if (entry.stock_type === 'in') totalIn += entry.qty;
            else totalOut += entry.qty;
        });

        res.json({
            product,
            ledger,
            summary: {
                total_in: totalIn,
                total_out: totalOut,
                net_movement: totalIn - totalOut
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ledger', error: error.message });
    }
};

// @desc    Manually Sync Stock Entry to Tally
// @route   POST /api/admin/stock/:id/sync
// @access  Admin
exports.syncStockEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const tallyService = require('../services/tallyService');

        const result = await tallyService.syncStockEntryToTally(id);

        if (result.success) {
            res.json({ message: 'Sync initiated successfully', queued: result.queued });
        } else {
            res.status(400).json({ message: result.error || 'Sync failed' });
        }
    } catch (error) {
        console.error('Stock Sync Error:', error);
        res.status(500).json({ message: 'Failed to sync stock entry', error: error.message });
    }
};
