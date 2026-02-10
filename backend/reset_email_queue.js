const mongoose = require('mongoose');
const dotenv = require('dotenv');
const EmailQueue = require('./models/EmailQueue');

dotenv.config();

async function resetQueue() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await EmailQueue.updateMany(
            { status: { $in: ['pending', 'processing', 'failed'] } },
            {
                $set: {
                    status: 'pending',
                    scheduledAt: new Date(),
                    attempts: 0,
                    error: null
                }
            }
        );

        console.log(`✅ Reset ${result.modifiedCount} emails in the queue for immediate delivery.`);
        process.exit(0);
    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

resetQueue();
