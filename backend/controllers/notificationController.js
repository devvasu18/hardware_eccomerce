const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user is populated by auth middleware
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await notificationService.getNotifications(userId, limit, skip);

        // Also get total count for pagination if needed, but for now just returning list
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await notificationService.getUnreadCount(userId);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Get Notification Count Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch count' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.id;
        await notificationService.markAsRead(notificationId, userId);
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await notificationService.markAllAsRead(userId);
        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};
exports.registerToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { token, platform } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        await notificationService.registerDeviceToken(userId, token, platform);
        res.json({ success: true, message: 'Device token registered' });
    } catch (error) {
        console.error('Register Token Error:', error);
        res.status(500).json({ success: false, message: 'Failed to register token' });
    }
};
