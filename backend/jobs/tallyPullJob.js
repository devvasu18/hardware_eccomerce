const cron = require('node-cron');
const tallyPullService = require('../services/tallyPullService');

/**
 * Initialize Tally Pull Jobs
 */
const initTallyPullJobs = () => {
    // Schedule Stock Sync (Incremental Voucher Check) every 10 minutes
    // Runs at minute 5, 15, 25, 35, 45, 55
    cron.schedule('*/10 * * * *', async () => {
        console.log('[Cron] Running Scheduled Tally Pull Sync...');
        try {
            // First check for modified vouchers
            const voucherResult = await tallyPullService.fetchModifiedVouchers();

            // If vouchers were modified, the service automatically triggers a stock sync.
            // But we can also force a stock sync periodically (e.g., daily) to ensure consistency.

            console.log('[Cron] Tally Pull Sync Completed.', voucherResult);
        } catch (error) {
            console.error('[Cron] Tally Pull Sync Failed:', error);
        }
    });

    // Schedule specific full stock reset once a day at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Cron] Running Daily Full Stock Reset...');
        try {
            const stockResult = await tallyPullService.fetchClosingBalances();
            console.log('[Cron] Daily Stock Reset Completed.', stockResult);
        } catch (error) {
            console.error('[Cron] Daily Stock Reset Failed:', error);
        }
    });

    console.log('✅ Tally Pull Jobs Scheduled');
};

module.exports = { initTallyPullJobs };
