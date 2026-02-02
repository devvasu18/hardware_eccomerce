const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '1s' } // Support TTL to auto-remove from DB
    }
}, { timestamps: true });

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);
