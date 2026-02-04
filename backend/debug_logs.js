const mongoose = require('mongoose');
const TallyStatusLog = require('./models/TallyStatusLog');
require('dotenv').config();

async function checkLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const logs = await TallyStatusLog.find().sort({ checkedAt: -1 }).limit(5);
        console.log('--- Recent Tally Logs ---');
        console.log(JSON.stringify(logs, null, 2));

        const count = await TallyStatusLog.countDocuments();
        console.log(`Total Logs: ${count}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLogs();
