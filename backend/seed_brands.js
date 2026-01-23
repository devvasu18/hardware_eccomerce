const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Brand = require('./models/Brand');

dotenv.config();

const brandsData = [
    { name: "Bosch", slug: "bosch", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/bosch.svg" },
    { name: "Makita", slug: "makita", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/makita.svg" },
    { name: "DeWalt", slug: "dewalt", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/dewalt.svg" },
    { name: "Stanley", slug: "stanley", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/stanley.svg" },
    { name: "3M", slug: "3m", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/3m.svg" },
    { name: "Siemens", slug: "siemens", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/siemens.svg" },
    { name: "Schneider", slug: "schneider", logo_image: "https://raw.githubusercontent.com/gilbarbara/logos/master/logos/schneider-electric.svg" }
];

async function seedBrands() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for Brand Seeding');

        // We use upsert to preserve existing brands if we want, or just wipe and recreate.
        // Since the user reported broken images, wiping and recreating is cleanest for the list.
        await Brand.deleteMany({});
        console.log('Cleared existing brands');

        await Brand.insertMany(brandsData);
        console.log(`Seeded ${brandsData.length} brands with valid logos`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedBrands();
