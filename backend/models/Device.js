const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: 'android'
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Device', DeviceSchema);
