const mongoose = require('mongoose');
require('dotenv').config();
const TallySyncQueue = require('./models/TallySyncQueue');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const items = await TallySyncQueue.find().sort({ createdAt: -1 }).limit(10);
        console.log('--- Queue Items ---');
        console.log(JSON.stringify(items, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
