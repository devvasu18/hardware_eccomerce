const mongoose = require('mongoose');
const Product = require('./models/Product');
const Offer = require('./models/Offer');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Find an offer
        const offer = await Offer.findOne();
        if (!offer) {
            console.log('No offers found in DB');
            return;
        }
        console.log(`Using Offer: ${offer.title} (${offer._id})`);

        // 2. Find "test" product
        const product = await Product.findOne({ title: { $regex: /test/i } });
        if (!product) {
            console.log('Product "test" not found');
            return;
        }
        console.log(`Found Product: ${product.title} (${product._id})`);

        // 3. Update Product manually (simulating what controller does)
        // Controller logic:
        /*
        if (updates.offers && typeof updates.offers === 'string') {
            updates.offers = updates.offers.split(',').map(id => id.trim()).filter(id => id);
        }
        */

        // Let's rely on Mongoose directly first to ensure DB works
        product.offers = [offer._id];
        await product.save();
        console.log('Product saved with offer.');

        // 4. Verify
        const updatedProduct = await Product.findById(product._id).populate('offers');
        console.log('--- Post Update ---');
        console.log(`Offers Linked: ${updatedProduct.offers.length}`);
        if (updatedProduct.offers.length > 0) {
            console.log(`Offer Title: ${updatedProduct.offers[0].title}`);
        } else {
            console.log('ERROR: Offer not saved!');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
