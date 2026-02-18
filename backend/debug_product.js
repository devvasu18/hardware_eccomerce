const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const product = await Product.findOne({ 'title.en': /Adjustable Coilover Suspension Kit/i });
    if (product) {
        console.log('Product Found:', product._id);
        console.log('Keywords Type:', typeof product.keywords);
        console.log('Keywords Value:', JSON.stringify(product.keywords));
        console.log('Is Array?', Array.isArray(product.keywords));
    } else {
        console.log('Product Not Found');
    }
    await mongoose.disconnect();
}

check();
