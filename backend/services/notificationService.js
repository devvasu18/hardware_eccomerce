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
const SystemSettings = require('../models/SystemSettings');

// Cache for system settings
let cachedSettings = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getSystemSettings = async () => {
    const now = Date.now();
    if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
        return cachedSettings;
    }
    try {
        let settings = await SystemSettings.findById('system_settings');
        if (!settings) {
            settings = await SystemSettings.create({ _id: 'system_settings' });
        }
        cachedSettings = settings;
        lastFetch = now;
        return settings;
    } catch (error) {
        console.error('Error fetching system settings:', error);
        return null;
    }
};

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

const sendPushNotification = async (userId, title, body, data = {}, sound = 'default') => {
    if (!isInitialized()) {
        logger.warn('⚠️ Push skipped: Firebase Admin not initialized');
        return;
    }

    try {
        const devices = await Device.find({ user: userId });
        if (!devices.length) {
            logger.info(`ℹ️ Push skipped: No registered devices for user ${userId}`);
            return;
        }

        const tokens = devices.map(d => d.token);

        // Clean sound name (remove extension and path)
        let soundName = 'default';
        if (sound && sound !== 'default') {
            soundName = sound.split('/').pop().split('.')[0];
        }

        // Construct message payload
        const message = {
            notification: {
                title,
                body
            },
            android: {
                priority: 'high', // CRITICAL: Wake up device even if app is closed/dozing
                notification: {
                    sound: soundName === 'default' ? 'default' : soundName,
                    channelId: soundName === 'default' ? "hardware_notification_channel_v3" : `channel_${soundName}_v3`,
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK' // For consistency, though we use native
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: soundName === 'default' ? 'default' : `${soundName}.aiff`, // iOS often likes extensions
                        badge: 1
                    }
                },
                headers: {
                    'apns-priority': '10' // High priority for iOS
                }
            },
            data: {
                ...data,
                sound: soundName,
                title,
                body,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        logger.info(`🔥 Push sent to ${response.successCount} devices (User: ${userId}, Failed: ${response.failureCount})`);

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

        // 2. Fetch Settings for Sound
        const settings = await getSystemSettings();
        let sound = 'default';
        if (settings && settings.notificationSoundEnabled) {
            // Apply special "Order Placed" sound ONLY to Customers (USER role) when an order is first placed
            const isOrderPlaced = type === 'ORDER_PLACED';
            const isCustomer = role === 'USER';

            if (isOrderPlaced && isCustomer) {
                sound = settings.orderNotificationSound || 'default';
            } else {
                sound = settings.notificationSound || 'default';
            }
        }

        // 2. Send via Push (Background)
        // Convert dynamic data to string for FCM data payload
        const pushData = {
            type: type || 'INFO',
            id: savedNotif._id.toString(),
            url: redirectUrl || '',
            sound: sound // Include sound name in data
        };

        // Fire and forget push notification
        sendPushNotification(userId, title, message, pushData, sound);

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
