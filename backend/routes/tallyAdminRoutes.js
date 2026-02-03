const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const TallySyncQueue = require('../models/TallySyncQueue');
const TallyStatusLog = require('../models/TallyStatusLog');
const { runHealthCheckNow } = require('../jobs/tallyHealthCheckJob');

// Get sync queue status
router.get('/queue', protect, admin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const query = status ? { status } : {};

        const items = await TallySyncQueue.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await TallySyncQueue.countDocuments(query);
        const statusCounts = await TallySyncQueue.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const counts = { pending: 0, processing: 0, synced: 0, failed: 0 };
        statusCounts.forEach(item => counts[item._id] = item.count);

        res.json({
            success: true,
            data: items,
            pagination: { currentPage: parseInt(page), totalItems: total },
            counts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get logs
router.get('/logs', protect, admin, async (req, res) => {
    try {
        const logs = await TallyStatusLog.find().sort({ checkedAt: -1 }).limit(50);
        res.json({ success: true, data: logs });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Manual Health Check
router.post('/health-check', protect, admin, async (req, res) => {
    const result = await runHealthCheckNow();
    res.json(result);
});

// Retry Item
router.post('/queue/:id/retry', protect, admin, async (req, res) => {
    try {
        const item = await TallySyncQueue.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });

        item.status = 'pending';
        item.retryCount = 0;
        item.lastError = null;
        await item.save();
        res.json({ success: true, message: 'Reset for retry' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete Item
router.delete('/queue/:id', protect, admin, async (req, res) => {
    await TallySyncQueue.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;
