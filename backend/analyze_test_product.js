const mongoose = require('mongoose');
const Product = require('./models/Product');
const Offer = require('./models/Offer');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const product = await Product.findOne({ title: { $regex: /test/i } }).populate('offers');

        if (!product) {
            console.log('Product "test" not found');
            return;
        }

        console.log('--- Product Details ---');
        console.log(`Title: ${product.title}`);
        console.log(`MRP: ${product.mrp}`);
        console.log(`Selling Price: ${product.selling_price_a}`);
        console.log(`Offers Linked: ${product.offers.length}`);

        if (product.offers.length > 0) {
            console.log('\n--- Linked Offers ---');
            product.offers.forEach(o => {
                console.log(`Offer: ${o.title}`);
                console.log(`Percentage: ${o.percentage}%`);
                console.log(`Slug: ${o.slug}`);

                // Simulate calculation
                const basePrice = product.selling_price_a || product.mrp || 0;
                const discountAmount = (basePrice * o.percentage) / 100;
                const finalPrice = Math.round(basePrice - discountAmount);

                console.log(`\n>>> Expected Frontend Price with Offer "${o.title}": ₹${finalPrice}`);
                console.log(`(Calculation: ${basePrice} - ${o.percentage}% = ${finalPrice})`);
            });
        } else {
            console.log('\nNo offers linked to this product.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
