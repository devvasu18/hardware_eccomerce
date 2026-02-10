const MessageQueue = require('../models/MessageQueue');
const logger = require('../utils/logger');

/**
 * Cleanup stuck messages on server startup
 * Resets messages that were in 'processing' state when server crashed
 */
async function cleanupStuckMessages() {
    try {
        const result = await MessageQueue.updateMany(
            { status: 'processing' },
            {
                $set: {
                    status: 'pending',
                    sessionId: 'default',
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount > 0) {
            logger.warn(`[Cleanup] Reset ${result.modifiedCount} stuck messages to pending`);
        } else {
            logger.info('[Cleanup] No stuck messages found');
        }

        return result.modifiedCount;
    } catch (error) {
        logger.error('[Cleanup] Failed to reset stuck messages:', error);
        throw error;
    }
}

/**
 * Cleanup stuck emails on server startup
 */
async function cleanupStuckEmails() {
    try {
        const EmailQueue = require('../models/EmailQueue');
        const result = await EmailQueue.updateMany(
            { status: 'processing' },
            {
                $set: {
                    status: 'pending',
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount > 0) {
            logger.warn(`[Cleanup] Reset ${result.modifiedCount} stuck emails to pending`);
        }

        return result.modifiedCount;
    } catch (error) {
        logger.error('[Cleanup] Failed to reset stuck emails:', error);
        throw error;
    }
}

/**
 * Cleanup old failed messages (older than 30 days)
 * Moves them to a separate collection for archival
 */
async function archiveOldFailedMessages() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await MessageQueue.deleteMany({
            status: 'failed',
            updatedAt: { $lt: thirtyDaysAgo }
        });

        if (result.deletedCount > 0) {
            logger.info(`[Cleanup] Archived ${result.deletedCount} old failed messages`);
        }

        return result.deletedCount;
    } catch (error) {
        logger.error('[Cleanup] Failed to archive old messages:', error);
        throw error;
    }
}

/**
 * Cleanup old failed emails (older than 30 days)
 */
async function archiveOldFailedEmails() {
    try {
        const EmailQueue = require('../models/EmailQueue');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await EmailQueue.deleteMany({
            status: 'failed',
            updatedAt: { $lt: thirtyDaysAgo }
        });

        if (result.deletedCount > 0) {
            logger.info(`[Cleanup] Archived ${result.deletedCount} old failed emails`);
        }

        return result.deletedCount;
    } catch (error) {
        logger.error('[Cleanup] Failed to archive old emails:', error);
        throw error;
    }
}

/**
 * Get queue health statistics
 */
async function getQueueHealth() {
    try {
        const stats = await MessageQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const health = {
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            total: 0
        };

        stats.forEach(stat => {
            health[stat._id] = stat.count;
            health.total += stat.count;
        });

        return health;
    } catch (error) {
        logger.error('[Cleanup] Failed to get queue health:', error);
        return null;
    }
}

/**
 * Get email queue health statistics
 */
async function getEmailQueueHealth() {
    try {
        const EmailQueue = require('../models/EmailQueue');
        const stats = await EmailQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const health = {
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            total: 0
        };

        stats.forEach(stat => {
            health[stat._id] = stat.count;
            health.total += stat.count;
        });

        return health;
    } catch (error) {
        logger.error('[Cleanup] Failed to get email queue health:', error);
        return null;
    }
}

module.exports = {
    cleanupStuckMessages,
    cleanupStuckEmails,
    archiveOldFailedMessages,
    archiveOldFailedEmails,
    getQueueHealth,
    getEmailQueueHealth
};
