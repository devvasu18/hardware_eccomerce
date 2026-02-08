const mongoose = require('mongoose');
const Product = require('./models/Product');
const ProductStock = require('./models/ProductStock');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Create Test Product with Models/Variants
        // We use a dummy category ID. Validation only checks generic ObjectId type unless populated.
        const testProduct = await Product.create({
            title: 'Test Stock Product ' + Date.now(),
            slug: 'test-stock-product-' + Date.now(),
            mrp: 1000,
            category: new mongoose.Types.ObjectId(),
            models: [{
                name: 'Model A',
                variations: [{
                    type: 'Color',
                    value: 'Red',
                    price: 100,
                    stock: 10 // Initial Stock
                }]
            }],
            images: [{ url: 'http://example.com/img.jpg', isMain: true }] // required based on schema
        });

        console.log('Test Product Created:', testProduct._id);
        const modelId = testProduct.models[0]._id;
        const variantId = testProduct.models[0].variations[0]._id;

        console.log(`Initial Stock for Model ${modelId} / Variant ${variantId}: 10`);

        // 2. Simulate Stock Entry Update Logic (same as stockController.js)
        const item = {
            product_id: testProduct._id,
            model_id: modelId,
            variant_id: variantId,
            qty: 5
        };

        console.log('Adding 5 stock via updateOne...');

        // Update Logic copied from stockController
        const updateResult = await Product.updateOne(
            { _id: item.product_id },
            { $inc: { "models.$[m].variations.$[v].stock": item.qty } },
            { arrayFilters: [{ "m._id": item.model_id }, { "v._id": item.variant_id }] }
        );

        console.log('Update Result:', updateResult);

        // 3. Verify
        const updatedProduct = await Product.findById(testProduct._id);
        const newStock = updatedProduct.models[0].variations[0].stock;

        console.log(`New Stock: ${newStock}`);

        if (newStock === 15) {
            console.log('SUCCESS: Stock updated correctly for Model/Variant.');
        } else {
            console.log('FAILURE: Stock not updated correctly.');
        }

        // Cleanup
        await Product.deleteOne({ _id: testProduct._id });
        console.log('Cleanup done.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
