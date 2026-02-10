const mongoose = require('mongoose');
const whatsappManager = require('./services/whatsappSessionManager');
const dotenv = require('dotenv');

dotenv.config();

async function restartSessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const sessions = ['primary', 'secondary'];
        for (const id of sessions) {
            console.log(`Restarting session: ${id}...`);
            try {
                await whatsappManager.startSession(id);
                console.log(`✅ Session ${id} restart initiated.`);
            } catch (e) {
                console.error(`❌ Session ${id} failed:`, e.message);
            }
        }

        console.log('Waiting 10 seconds for initialization...');
        setTimeout(() => {
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

restartSessions();
