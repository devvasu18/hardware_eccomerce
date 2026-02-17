
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

const checkFeatured = async () => {
    await connectDB();

    try {
        const allProducts = await Product.find({});
        console.log(`Querying collection: ${Product.collection.name}`);
        console.log(`Total Products: ${allProducts.length}`);

        const featured = await Product.find({ isFeatured: true });
        console.log(`Featured Products (raw): ${featured.length}`);

        const featuredVisible = await Product.find({ isFeatured: true, isVisible: true });
        console.log(`Featured AND Visible Products: ${featuredVisible.length}`);

        if (featured.length > 0) {
            console.log('Sample Featured Product:', JSON.stringify(featured[0], null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

checkFeatured();
