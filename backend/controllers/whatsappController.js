const MessageQueue = require('../models/MessageQueue');
const whatsappManager = require('../services/whatsappSessionManager');
const whatsappWorker = require('../whatsappWorker');

// @desc    Get Session Status
// @route   GET /api/whatsapp/status/:sessionId
// @access  Admin
exports.getSessionStatus = (req, res) => {
    const { sessionId } = req.params;
    const status = whatsappManager.getStatus(sessionId);
    res.json(status);
};

// @desc    Send Message (Queue)
// @route   POST /api/whatsapp/send
// @access  Admin/System
exports.sendMessage = async (req, res) => {
    try {
        const { recipient, message, sessionId = 'default', scheduledAt } = req.body;

        if (!recipient || !message) {
            return res.status(400).json({ message: 'Recipient and message body are required' });
        }

        const newMessage = new MessageQueue({
            recipient,
            messageBody: message,
            sessionId,
            status: 'pending',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message queued successfully',
            queueId: newMessage._id
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to queue message', error: error.message });
    }
};

// @desc    View Queue Status
// @route   GET /api/whatsapp/queue
// @access  Admin
exports.getQueueStatus = async (req, res) => {
    try {
        const pendingCount = await MessageQueue.countDocuments({ status: 'pending' });
        const sentCount = await MessageQueue.countDocuments({ status: 'sent' });
        const failedCount = await MessageQueue.countDocuments({ status: 'failed' });

        const recentMessages = await MessageQueue.find().sort({ createdAt: -1 }).limit(10);

        res.json({
            pending: pendingCount,
            sent: sentCount,
            failed: failedCount,
            recent: recentMessages
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Restart Session (Fix Error State)
// @route   POST /api/whatsapp/restart/:sessionId
// @access  Admin
exports.restartSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await whatsappManager.deleteSession(sessionId); // Clean old/corrupted session

        // Reset worker attempts so it can start fresh
        whatsappWorker.resetSessionAttempts(sessionId);

        // Trigger async start - don't await full connection as it takes time
        whatsappManager.startSession(sessionId).catch(err => console.error('Restart failed', err));

        // Also manually trigger worker init to restart the loop if it was stopped
        whatsappWorker.initSession(sessionId).catch(err => console.error('Worker init failed', err));

        res.json({ message: `Session ${sessionId} restart initiated`, status: 'initializing' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to restart session', error: error.message });
    }
};
