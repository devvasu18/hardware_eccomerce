const mongoose = require('mongoose');

const tallyStatusLogSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['online', 'offline'],
        required: true
    },
    checkedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    responseTime: {
        type: Number, // milliseconds
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    },
    queueProcessed: {
        type: Number,
        default: 0
    },
    queueSuccess: {
        type: Number,
        default: 0
    },
    queueFailed: {
        type: Number,
        default: 0
    }
});

tallyStatusLogSchema.index({ checkedAt: -1 });

tallyStatusLogSchema.statics.cleanupOldLogs = async function () {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = await this.deleteMany({ checkedAt: { $lt: twoDaysAgo } });
    console.log(`Cleaned up ${result.deletedCount} old Tally status logs`);
    return result;
};

module.exports = mongoose.model('TallyStatusLog', tallyStatusLogSchema);
