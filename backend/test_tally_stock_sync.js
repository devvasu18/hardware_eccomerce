const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Product = require('./models/Product');
const Party = require('./models/Party');
const StockEntry = require('./models/StockEntry');
const ProductStock = require('./models/ProductStock');
const TallySyncQueue = require('./models/TallySyncQueue');

// Services
const tallyService = require('./services/tallyService');

// Main Test Function
const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Create Dummy Supplier (Party)
        console.log('Creating Test Party...');
        const testParty = await Party.create({
            name: 'Test Supplier ' + Date.now(),
            phone_no: '9876543210',
            email: 'test@supplier.com',
            gst_no: '24ABCDE1234F1Z5',
            address: '123 Test Street, Ahmedabad, Gujarat'
        });
        console.log('Party Created:', testParty.name, testParty._id);

        // 2. Create Dummy Product
        console.log('Creating Test Product...');
        const testProduct = await Product.create({
            title: 'Tally Sync Test Product ' + Date.now(),
            slug: 'tally-sync-test-' + Date.now(),
            mrp: 500,
            category: new mongoose.Types.ObjectId(), // Creating a fake ID for category
            models: [{
                name: 'Standard Model',
                variations: [{
                    type: 'Color',
                    value: 'Blue',
                    price: 200,
                    stock: 0
                }]
            }],
            images: [{ url: 'http://example.com/test.jpg', isMain: true }]
        });
        console.log('Product Created:', testProduct.title, testProduct._id);

        const modelId = testProduct.models[0]._id;
        const variantId = testProduct.models[0].variations[0]._id;

        // 3. Create Stock Entry (Simulate Controller Logic)
        console.log('Creating Stock Entry...');

        const invoiceNo = `INV-TEST-${Date.now()}`;
        const items = [{
            product_id: testProduct._id,
            model_id: modelId,
            variant_id: variantId,
            qty: 10,
            unit_price: 150,
            total_price: 1500
        }];

        // Create Header
        const stockEntry = await StockEntry.create({
            party_id: testParty._id,
            invoice_no: invoiceNo,
            bill_date: new Date(),
            final_bill_amount: 1575, // 1500 + 5% Tax
            final_bill_amount_without_tax: 1500,
            cgst: 37.5,
            sgst: 37.5,
            tallyStatus: 'pending'
        });
        console.log('Stock Entry Created:', stockEntry.invoice_no, stockEntry._id);

        // Create Line Items (Ledger)
        await ProductStock.create({
            stock_id: stockEntry._id,
            product_id: items[0].product_id,
            model_id: items[0].model_id,
            variant_id: items[0].variant_id,
            party_id: testParty._id,
            stock_type: 'in',
            qty: items[0].qty,
            unit_price: items[0].unit_price,
            total_price: items[0].total_price
        });

        // 4. Trigger Sync
        console.log('------------------------------------------------');
        console.log('Triggering Tally Sync...');
        console.log('------------------------------------------------');

        const result = await tallyService.syncStockEntryToTally(stockEntry._id);

        console.log('Sync Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ SUCCESS: Stock Entry Synced to Tally (or Mocked)!');
        } else if (result.queued) {
            console.log('⚠️ QUEUED: Tally Offline or Error, added to Queue.');
        } else {
            console.log('❌ FAILED: ' + result.error);
        }

        // 5. Check Final Status in DB
        const finalEntry = await StockEntry.findById(stockEntry._id);
        console.log('Final DB Status:', finalEntry.tallyStatus);
        console.log('Error Log:', finalEntry.tallyErrorLog || 'None');

        // Cleanup
        console.log('Cleaning up test data...');
        // await Party.deleteOne({ _id: testParty._id });
        // await Product.deleteOne({ _id: testProduct._id });
        // await StockEntry.deleteOne({ _id: stockEntry._id });
        // await ProductStock.deleteMany({ stock_id: stockEntry._id });
        // await TallySyncQueue.deleteMany({ relatedId: stockEntry._id });
        console.log('Cleanup Skipped for Debugging. Manually delete if needed.');

    } catch (error) {
        console.error('Test Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

run();
