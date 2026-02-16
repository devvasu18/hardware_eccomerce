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

        if (io) {
            const userIdStr = String(userId);
            // Emit to specific user
            io.to(userIdStr).emit('notification', savedNotif);
            logger.info(`🔔 EMIT: Sent notification to room "${userIdStr}" (Title: ${title})`);

            // Debug: Check if room has sockets
            const roomSize = io.sockets.adapter.rooms.get(userIdStr)?.size || 0;
            logger.info(`   -> Room "${userIdStr}" has ${roomSize} active sockets.`);

        } else {
            logger.warn('Socket.IO not initialized, notification saved but not emitted');
        }

        return savedNotif;
    } catch (error) {
        logger.error('Error sending notification:', error);
        // Don't crash the caller, just log
    }
};

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

module.exports = {
    init,
    sendNotification,
    markAsRead,
    getUnreadCount,
    getNotifications,
    markAllAsRead
};
