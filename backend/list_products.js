const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function list() {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({}).limit(10).select('title');
    console.log(JSON.stringify(products, null, 2));
    await mongoose.disconnect();
}

list();
