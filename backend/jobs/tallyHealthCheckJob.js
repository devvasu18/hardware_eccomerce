const cron = require('node-cron');
const { checkTallyHealth, processQueue } = require('../services/tallyService');
const TallyStatusLog = require('../models/TallyStatusLog');
const SystemSettings = require('../models/SystemSettings');

/**
 * Hourly health check and queue processing job
 */
function startTallyHealthCheckJob() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('🔄 Running hourly Tally health check and queue processing...');

        try {
            const settings = await SystemSettings.findById('system_settings');
            if (settings && settings.tallyIntegrationEnabled === false) {
                console.log('🔄 Tally Sync skipped - Integration is disabled in settings');
                return;
            }

            const health = await checkTallyHealth();
            let queueStats = { processed: 0, success: 0, failed: 0 };

            if (health.online) {
                console.log('✅ Tally is ONLINE - processing queue...');
                queueStats = await processQueue();
            } else {
                console.log(`❌ Tally is OFFLINE - ${health.error}`);
            }

            // Log Status
            await TallyStatusLog.create({
                status: health.online ? 'online' : 'offline',
                checkedAt: new Date(),
                responseTime: health.responseTime,
                errorMessage: health.error,
                queueProcessed: queueStats.processed,
                queueSuccess: queueStats.success,
                queueFailed: queueStats.failed
            });

            // Cleanup old logs
            await TallyStatusLog.cleanupOldLogs();

        } catch (error) {
            console.error('❌ Error in hourly Tally health check:', error);
        }
    });

    console.log('⏰ Tally hourly health check job scheduled (runs every hour at :00)');
}

/**
 * Manual trigger
 */
async function runHealthCheckNow() {
    try {
        const settings = await SystemSettings.findById('system_settings');
        if (settings && settings.tallyIntegrationEnabled === false) {
            return { success: false, message: 'Tally integration is disabled in system settings' };
        }

        const health = await checkTallyHealth();
        let queueStats = { processed: 0, success: 0, failed: 0 };

        if (health.online) {
            queueStats = await processQueue();
        }

        await TallyStatusLog.create({
            status: health.online ? 'online' : 'offline',
            checkedAt: new Date(),
            responseTime: health.responseTime,
            errorMessage: health.error,
            queueProcessed: queueStats.processed,
            queueSuccess: queueStats.success,
            queueFailed: queueStats.failed
        });

        return { success: true, health, queueStats };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

module.exports = { startTallyHealthCheckJob, runHealthCheckNow };
