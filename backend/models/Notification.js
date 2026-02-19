const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['ORDER', 'ORDER_PLACED', 'ORDER_UPDATE', 'SYSTEM', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT', 'STOCK', 'CMS'],
        required: true
    },
    entityId: { type: String }, // Flexible ID (could be order ID string or ObjectId)
    redirectUrl: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['HIGH', 'NORMAL', 'LOW'], default: 'NORMAL' },
    createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
