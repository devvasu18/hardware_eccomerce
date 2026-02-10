const EmailQueue = require('../models/EmailQueue');
const logger = require('../utils/logger');

/**
 * Get Email system health status
 */
exports.getEmailHealth = async (req, res) => {
    try {
        const queueStats = await EmailQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const emailWorker = require('../emailWorker');
        const isSmtpHealthy = await emailWorker.verifySmtp();

        const health = {
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            total: 0,
            smtpStatus: isSmtpHealthy ? 'connected' : 'disconnected'
        };

        queueStats.forEach(stat => {
            health[stat._id] = stat.count;
            health.total += stat.count;
        });

        res.json(health);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get email health status', error: error.message });
    }
};

/**
 * Get failed emails
 */
exports.getFailedEmails = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const emails = await EmailQueue.find({ status: 'failed' })
            .sort({ failedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await EmailQueue.countDocuments({ status: 'failed' });

        res.json({
            emails,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get failed emails', error: error.message });
    }
};

/**
 * Retry a failed email
 */
exports.retryEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const email = await EmailQueue.findById(id);
        if (!email) {
            return res.status(404).json({ message: 'Email not found' });
        }

        email.status = 'pending';
        email.attempts = 0;
        email.error = null;
        email.scheduledAt = new Date();
        await email.save();

        res.json({ message: 'Email queued for retry', data: email });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retry email', error: error.message });
    }
};

/**
 * Retry all failed emails
 */
exports.retryAllFailedEmails = async (req, res) => {
    try {
        const result = await EmailQueue.updateMany(
            { status: 'failed' },
            {
                $set: {
                    status: 'pending',
                    attempts: 0,
                    error: null,
                    scheduledAt: new Date()
                }
            }
        );

        res.json({
            message: `${result.modifiedCount} emails queued for retry`,
            count: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retry emails', error: error.message });
    }
};

/**
 * Delete a failed email
 */
exports.deleteEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const email = await EmailQueue.findByIdAndDelete(id);
        if (!email) {
            return res.status(404).json({ message: 'Email not found' });
        }
        res.json({ message: 'Email deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete email', error: error.message });
    }
};
