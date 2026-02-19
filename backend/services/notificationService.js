const Notification = require('../models/Notification');
const logger = require('../utils/logger');

let io;

const init = (socketIo) => {
    io = socketIo;
    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Join user-specific room
        socket.on('join', (userId) => {
            if (userId) {
                const userIdStr = String(userId);
                socket.join(userIdStr);
                logger.info(`✅ User joined room: ${userIdStr} (Socket: ${socket.id})`);
            }
        });

        // Join role-specific room (e.g., 'admin')
        socket.on('join_role', (role) => {
            if (role) {
                socket.join(role);
                logger.info(`✅ Socket ${socket.id} joined role room: ${role}`);
            }
        });
    });
};


const Device = require('../models/Device');
const { admin, isInitialized } = require('../config/firebaseAdmin');

// ... existing socket init ...

const registerDeviceToken = async (userId, token, platform = 'android') => {
    try {
        await Device.findOneAndUpdate(
            { token }, // Find by token
            { user: userId, platform, lastActive: Date.now() }, // Update user owner
            { upsert: true, new: true }
        );
        logger.info(`📱 Device Registered: ${userId} - ${platform}`);
    } catch (error) {
        logger.error('Failed to register device token', error);
    }
};

const sendPushNotification = async (userId, title, body, data = {}) => {
    if (!isInitialized()) return;

    try {
        const devices = await Device.find({ user: userId });
        if (!devices.length) return;

        const tokens = devices.map(d => d.token);

        // Construct message payload
        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data, // Custom data like orderId, type
                click_action: "FLUTTER_NOTIFICATION_CLICK" // Standard action
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendMulticast(message);
        logger.info(`🔥 Push sent to ${response.successCount} devices (Failed: ${response.failureCount})`);

        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            // Cleanup invalid tokens
            if (failedTokens.length > 0) {
                await Device.deleteMany({ token: { $in: failedTokens } });
                logger.info(`🗑️ Removed ${failedTokens.length} invalid tokens`);
            }
        }

    } catch (error) {
        logger.error('Push Notification Error:', error);
    }
};

const sendNotification = async ({ userId, role, title, message, type, redirectUrl, entityId, priority }) => {
    try {
        const notification = new Notification({
            userId,
            role,
            title,
            message,
            type,
            entityId,
            redirectUrl,
            isRead: false,
            priority,
            createdAt: new Date()
        });

        const savedNotif = await notification.save();

        // 1. Send via Socket.IO (Real-time in-app)
        if (io) {
            const userIdStr = String(userId);
            io.to(userIdStr).emit('notification', savedNotif);
            logger.info(`🔔 SOCKET: Sent to "${userIdStr}"`);
        }

        // 2. Send via Push (Background)
        // Convert dynamic data to string for FCM data payload
        const pushData = {
            type: type || 'INFO',
            id: savedNotif._id.toString(),
            url: redirectUrl || ''
        };

        // Fire and forget push notification
        sendPushNotification(userId, title, message, pushData);

        return savedNotif;
    } catch (error) {
        logger.error('Error sending notification:', error);
    }
};

// Restore missing getter/setter functions
const markAsRead = async (notificationId, userId) => {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
    );
};

const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ userId, isRead: false });
};

const getNotifications = async (userId, limit = 50, skip = 0) => {
    return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

const markAllAsRead = async (userId) => {
    return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

// ... existing exports ...

module.exports = {
    init,
    sendNotification,
    markAsRead,
    getUnreadCount,
    getNotifications,
    markAllAsRead,
    registerDeviceToken
};
