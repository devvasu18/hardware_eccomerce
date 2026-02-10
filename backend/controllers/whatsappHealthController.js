const whatsappManager = require('../services/whatsappSessionManager');
const MessageQueue = require('../models/MessageQueue');

/**
 * Get WhatsApp system health status
 */
exports.getSystemHealth = async (req, res) => {
    try {
        const sessions = ['primary', 'secondary'];
        const health = {
            sessions: {},
            queue: {},
            overall: 'healthy'
        };

        // Check each session
        for (const sessionId of sessions) {
            const status = whatsappManager.getStatus(sessionId);
            health.sessions[sessionId] = {
                status: status.status,
                number: status.number,
                connected: ['connected', 'inChat', 'isLogged'].includes(status.status)
            };
        }

        // Check queue health
        const queueStats = await MessageQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        health.queue = {
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0
        };

        queueStats.forEach(stat => {
            health.queue[stat._id] = stat.count;
        });

        // Determine overall health
        const connectedSessions = Object.values(health.sessions).filter(s => s.connected).length;
        if (connectedSessions === 0) {
            health.overall = 'critical';
        } else if (connectedSessions === 1) {
            health.overall = 'degraded';
        } else if (health.queue.processing > 10) {
            health.overall = 'warning';
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get health status', error: error.message });
    }
};

/**
 * Get failed messages
 */
exports.getFailedMessages = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const messages = await MessageQueue.find({ status: 'failed' })
            .sort({ failedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('recipient messageBody error attempts failedAt createdAt');

        const count = await MessageQueue.countDocuments({ status: 'failed' });

        res.json({
            messages,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get failed messages', error: error.message });
    }
};

/**
 * Retry a failed message
 */
exports.retryMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await MessageQueue.findById(id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.status !== 'failed') {
            return res.status(400).json({ message: 'Only failed messages can be retried' });
        }

        // Reset message for retry
        message.status = 'pending';
        message.sessionId = 'default';
        message.attempts = 0;
        message.error = null;
        message.scheduledAt = new Date();
        await message.save();

        res.json({ message: 'Message queued for retry', data: message });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retry message', error: error.message });
    }
};

/**
 * Retry all failed messages
 */
exports.retryAllFailed = async (req, res) => {
    try {
        const result = await MessageQueue.updateMany(
            { status: 'failed' },
            {
                $set: {
                    status: 'pending',
                    sessionId: 'default',
                    attempts: 0,
                    error: null,
                    scheduledAt: new Date()
                }
            }
        );

        res.json({
            message: `${result.modifiedCount} messages queued for retry`,
            count: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retry messages', error: error.message });
    }
};

/**
 * Delete a failed message permanently
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await MessageQueue.findByIdAndDelete(id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete message', error: error.message });
    }
};

/**
 * Get queue statistics
 */
exports.getQueueStats = async (req, res) => {
    try {
        const stats = await MessageQueue.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    bySession: [
                        { $group: { _id: '$sessionId', count: { $sum: 1 } } }
                    ],
                    recentFailed: [
                        { $match: { status: 'failed' } },
                        { $sort: { failedAt: -1 } },
                        { $limit: 10 },
                        { $project: { recipient: 1, error: 1, failedAt: 1, attempts: 1 } }
                    ],
                    avgAttempts: [
                        { $match: { status: 'sent' } },
                        { $group: { _id: null, avg: { $avg: '$attempts' } } }
                    ]
                }
            }
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get queue stats', error: error.message });
    }
};

module.exports = exports;
