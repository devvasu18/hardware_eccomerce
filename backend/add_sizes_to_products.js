const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

async function addSizesToProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Add sizes to safety helmets and similar products
        const safetyProducts = await Product.find({
            $or: [
                { name: /helmet/i },
                { name: /gloves/i },
                { name: /jacket/i },
                { name: /vest/i },
                { name: /boots/i },
                { name: /goggles/i }
            ]
        });

        console.log(`Found ${safetyProducts.length} safety products to update`);

        for (const product of safetyProducts) {
            product.availableSizes = ['SM', 'M', 'L', 'XL'];
            await product.save();
            console.log(`✓ Added sizes to: ${product.name}`);
        }

        console.log('\n✅ Successfully added sizes to safety products!');
        console.log('Products with sizes can now display the size selector.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addSizesToProducts();
