const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

async function checkCategory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const catId = '698180223019ae1265ea8fc6';
        const category = await Category.findById(catId);

        if (!category) {
            console.log(`Category with ID ${catId} NOT FOUND.`);
            process.exit(0);
        }

        console.log(`Found Category: ${category.name} (${category.slug})`);

        const totalProducts = await Product.countDocuments({ category: catId });
        console.log(`Total products in this category (regardless of visibility): ${totalProducts}`);

        const visibleProducts = await Product.countDocuments({ category: catId, isVisible: true });
        console.log(`Visible products in this category: ${visibleProducts}`);

        if (visibleProducts > 0) {
            const sample = await Product.findOne({ category: catId, isVisible: true });
            console.log('Sample product:', {
                id: sample._id,
                title: sample.title,
                isVisible: sample.isVisible,
                category: sample.category
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCategory();
