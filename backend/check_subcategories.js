const mongoose = require('mongoose');
const SubCategory = require('./models/SubCategory');
const Category = require('./models/Category');

mongoose.connect('mongodb://localhost:27017/hardware_ecommerce')
    .then(async () => {
        console.log('Connected to MongoDB');

        // Get all categories
        const categories = await Category.find({ showInNav: true }).limit(10);
        console.log('\nCategories in navigation:', categories.length);

        for (const cat of categories) {
            const subCats = await SubCategory.find({ category_id: cat._id });
            console.log(`\n${cat.name} (${cat.slug}): ${subCats.length} sub-categories`);
            if (subCats.length > 0) {
                subCats.forEach(sc => console.log(`  - ${sc.name} (${sc.slug})`));
            }
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
