const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SpecialOffer = require('./models/SpecialOffer');
const Product = require('./models/Product');

dotenv.config();

async function seedSpecialOffers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for seeding special offers...\n');

        // Clear existing offers
        await SpecialOffer.deleteMany({});
        console.log('✓ Cleared existing special offers\n');

        // Get some products to create offers for
        const products = await Product.find().limit(20);

        if (products.length === 0) {
            console.log('❌ No products found! Please run seed_products_autoparts.js first.');
            process.exit(1);
        }

        // Select 6 products for special offers
        const selectedProducts = [
            products[0],  // First product
            products[5],  // 6th product
            products[10], // 11th product
            products[15], // 16th product
            products[18], // 19th product
            products[12]  // 13th product
        ].filter(p => p); // Filter out undefined

        const badges = ['HOT DEAL', 'CLEARANCE', 'BUNDLE OFFER', 'FLASH SALE', 'LIMITED TIME', 'MEGA DEAL'];
        const now = new Date();

        const offers = selectedProducts.map((product, index) => {
            const discountPercent = [25, 30, 35, 20, 40, 33][index];
            const originalPrice = product.basePrice;
            const offerPrice = Math.round(originalPrice * (1 - discountPercent / 100));

            // Create offers ending in 2, 3, 5, 7 days
            const daysUntilEnd = [2, 3, 5, 7, 4, 6][index];
            const endDate = new Date(now.getTime() + daysUntilEnd * 24 * 60 * 60 * 1000);

            return {
                productId: product._id,
                title: product.name,
                badge: badges[index],
                discountPercent: discountPercent,
                originalPrice: originalPrice,
                offerPrice: offerPrice,
                startDate: now,
                endDate: endDate,
                isLimitedStock: index % 2 === 0, // Every other offer has limited stock
                isActive: true,
                displayOrder: index + 1
            };
        });

        const insertedOffers = await SpecialOffer.insertMany(offers);

        console.log(`✅ Successfully created ${insertedOffers.length} special offers!\n`);
        console.log('Special Offers Created:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        for (const offer of insertedOffers) {
            const product = await Product.findById(offer.productId);
            const daysLeft = Math.ceil((offer.endDate - now) / (1000 * 60 * 60 * 24));

            console.log(`📦 ${offer.title}`);
            console.log(`   Badge: ${offer.badge}`);
            console.log(`   Discount: ${offer.discountPercent}% OFF`);
            console.log(`   Price: ₹${offer.originalPrice} → ₹${offer.offerPrice}`);
            console.log(`   Savings: ₹${offer.originalPrice - offer.offerPrice}`);
            console.log(`   Ends in: ${daysLeft} days`);
            console.log(`   Limited Stock: ${offer.isLimitedStock ? 'Yes' : 'No'}`);
            console.log(`   Category: ${product.category}`);
            console.log('');
        }

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n✨ Special offers are now live on your homepage!');
        console.log('Visit http://localhost:3000 to see them.\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding special offers:', error);
        process.exit(1);
    }
}

seedSpecialOffers();
