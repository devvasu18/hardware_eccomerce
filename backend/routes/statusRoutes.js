const express = require('express');
const router = express.Router();
const StatusLog = require('../models/StatusLog');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Admin middleware
const isAdmin = (req, res, next) => {
    const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff'];
    if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Update order status with logging
router.post('/update', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { orderId, status, notes } = req.body;

        // Validation
        const validStatuses = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
            });
        }

        // Check if order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Prevent invalid status transitions
        const currentStatus = order.status;
        const statusOrder = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered'];

        if (status !== 'Cancelled') {
            const currentIndex = statusOrder.indexOf(currentStatus);
            const newIndex = statusOrder.indexOf(status);

            // Allow moving forward or staying same, but warn about backward movement
            if (newIndex < currentIndex && currentStatus !== 'Cancelled') {
                console.warn(`Warning: Moving status backward from ${currentStatus} to ${status}`);
            }
        }

        // Update order status
        order.status = status;

        // Update logistics updates array for backward compatibility
        order.logisticsUpdates.push({
            status,
            updatedBy: req.user.id,
            timestamp: new Date()
        });

        await order.save();

        // Fetch user details for log
        const dbUser = await User.findById(req.user.id);
        const name = dbUser ? (dbUser.username || dbUser.email) : 'Admin';

        // Create status log
        const statusLog = new StatusLog({
            order: orderId,
            status,
            updatedBy: req.user.id,
            updatedByName: name,
            updatedByRole: req.user.role,
            notes: notes || '',
            isSystemGenerated: false
        });
        await statusLog.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            order,
            statusLog
        });

    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: err.message
        });
    }
});

// Get status history for an order
router.get('/history/:orderId', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Check if order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization check
        const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'admin'];
        const isAdmin = adminRoles.includes(req.user.role);
        const isOwner = order.user && order.user.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            // If it's a guest order, we might need phone/email verification, 
            // but for now we block unauthorized access.
            return res.status(403).json({ message: 'Access denied. You are not authorized to view this order history.' });
        }

        // Fetch status logs
        const statusLogs = await StatusLog.find({ order: orderId })
            .populate('updatedBy', 'username email role')
            .sort({ timestamp: 1 }); // Chronological order

        res.json({
            success: true,
            count: statusLogs.length,
            statusHistory: statusLogs
        });

    } catch (err) {
        console.error('Get status history error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch status history',
            error: err.message
        });
    }
});

// Get all status logs (Admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { orderId, status, startDate, endDate } = req.query;

        const filter = {};
        if (orderId) filter.order = orderId;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const statusLogs = await StatusLog.find(filter)
            .populate('order')
            .populate('updatedBy', 'username email role')
            .sort({ timestamp: -1 })
            .limit(100); // Limit to prevent overwhelming response

        res.json({
            success: true,
            count: statusLogs.length,
            statusLogs
        });

    } catch (err) {
        console.error('Get all status logs error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch status logs',
            error: err.message
        });
    }
});

// Create initial status log for existing orders (Migration helper)
router.post('/migrate-existing', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find();
        let created = 0;

        for (const order of orders) {
            // Check if status log already exists
            const existingLog = await StatusLog.findOne({ order: order._id });

            if (!existingLog) {
                // Create initial status log
                const statusLog = new StatusLog({
                    order: order._id,
                    status: order.status,
                    updatedBy: req.user.id,
                    updatedByName: 'System Migration',
                    updatedByRole: 'system',
                    timestamp: order.createdAt,
                    notes: 'Initial status from migration',
                    isSystemGenerated: true
                });
                await statusLog.save();
                created++;
            }
        }

        res.json({
            success: true,
            message: `Migration complete. Created ${created} status logs.`,
            totalOrders: orders.length,
            logsCreated: created
        });

    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: err.message
        });
    }
});

module.exports = router;
