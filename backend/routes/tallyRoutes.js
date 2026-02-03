const express = require('express');
const router = express.Router();
const tallyService = require('../services/tallyService');

// Sync Sales Invoice (Admin Manual Trigger)
router.post('/sales/:id', async (req, res) => {
    try {
        const result = await tallyService.syncOrderToTally(req.params.id);

        if (result.success) {
            return res.json({ success: true, message: 'Synced to Tally' });
        } else if (result.queued) {
            return res.json({ success: true, message: 'Tally offline/busy - Queued for background sync', queued: true });
        } else {
            return res.status(500).json({ success: false, message: result.error });
        }

    } catch (error) {
        console.error('Tally Sync System Error:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
