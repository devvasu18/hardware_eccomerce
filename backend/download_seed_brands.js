const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Brand = require('./models/Brand');

dotenv.config();

// Create uploads/brands directory
const uploadDir = path.join(__dirname, 'uploads', 'brands');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const brandsToDownload = [
    { name: "Bosch", slug: "bosch", url: "https://placehold.co/400x200/png?text=Bosch", filename: 'bosch.png' },
    { name: "Makita", slug: "makita", url: "https://placehold.co/400x200/png?text=Makita", filename: 'makita.png' },
    { name: "DeWalt", slug: "dewalt", url: "https://placehold.co/400x200/png?text=DeWalt", filename: 'dewalt.png' },
    { name: "Stanley", slug: "stanley", url: "https://placehold.co/400x200/png?text=Stanley", filename: 'stanley.png' },
    { name: "3M", slug: "3m", url: "https://placehold.co/400x200/png?text=3M", filename: '3m.png' },
    { name: "Siemens", slug: "siemens", url: "https://placehold.co/400x200/png?text=Siemens", filename: 'siemens.png' },
    { name: "Schneider", slug: "schneider", url: "https://placehold.co/400x200/png?text=Schneider", filename: 'schneider.png' }
];

const downloadFile = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
            }
            const fileStream = fs.createWriteStream(filepath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

async function downloadAndSeed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected');

        // Clean brands
        await Brand.deleteMany({});
        console.log('Cleared existing brands');

        for (const b of brandsToDownload) {
            const filepath = path.join(uploadDir, b.filename);
            console.log(`Downloading ${b.name} logo...`);
            await downloadFile(b.url, filepath);
            console.log(`Saved to ${filepath}`);

            // Path to save in DB (relative to backend root, served via static middleware)
            // Note: server.js serves '/uploads' mapped to 'uploads' folder
            const dbImage = `uploads/brands/${b.filename}`;

            await Brand.create({
                name: b.name,
                slug: b.slug,
                logo_image: dbImage // Local path
            });
        }

        console.log('✅ All brands seeded with LOCAL images successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

downloadAndSeed();
