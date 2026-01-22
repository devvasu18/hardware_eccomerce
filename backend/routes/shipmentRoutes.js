const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const StatusLog = require('../models/StatusLog');
const { authenticateToken } = require('../middleware/auth');
const { upload, deleteOldBusPhoto } = require('../utils/imageUpload');

// Admin middleware
const isAdmin = (req, res, next) => {
    const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin'];
    if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Create/Assign Shipment to Order
router.post('/assign', authenticateToken, isAdmin, upload.single('busPhoto'), async (req, res) => {
    try {
        const {
            orderId,
            busNumber,
            driverContact,
            departureTime,
            expectedArrival,
            dispatchDate,
            liveStatus,
            notes
        } = req.body;

        // Validation
        if (!orderId || !busNumber || !driverContact || !departureTime || !expectedArrival) {
            return res.status(400).json({
                message: 'Missing required fields: orderId, busNumber, driverContact, departureTime, expectedArrival'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'Bus photo is required'
            });
        }

        // Check if order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order is already assigned
        const existingShipment = await Shipment.findOne({ order: orderId });
        if (existingShipment) {
            // Delete old photo if updating
            deleteOldBusPhoto(existingShipment.busPhotoUrl);
        }

        // Generate photo URL
        const busPhotoUrl = `/uploads/bus-photos/${req.file.filename}`;

        // Create or update shipment
        const shipmentData = {
            order: orderId,
            busNumber,
            busPhotoUrl,
            driverContact,
            departureTime: new Date(departureTime),
            expectedArrival: new Date(expectedArrival),
            dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
            liveStatus: liveStatus || 'Preparing',
            notes,
            assignedBy: req.user.id,
            lastUpdatedBy: req.user.id
        };

        let shipment;
        if (existingShipment) {
            shipment = await Shipment.findByIdAndUpdate(
                existingShipment._id,
                shipmentData,
                { new: true }
            ).populate('order').populate('assignedBy', 'username email');
        } else {
            shipment = new Shipment(shipmentData);
            await shipment.save();
            await shipment.populate('order');
            await shipment.populate('assignedBy', 'username email');
        }

        // Update order status to "Assigned to Bus"
        order.status = 'Assigned to Bus';

        // Update busDetails in order for backward compatibility
        order.busDetails = {
            busNumber,
            driverContact,
            departureTime: new Date(departureTime),
            expectedArrival: new Date(expectedArrival),
            dispatchDate: shipmentData.dispatchDate,
            busPhoto: busPhotoUrl
        };

        await order.save();

        // Create status log
        const statusLog = new StatusLog({
            order: orderId,
            status: 'Assigned to Bus',
            updatedBy: req.user.id,
            updatedByName: req.user.username || req.user.email,
            updatedByRole: req.user.role,
            notes: `Assigned to bus ${busNumber}`,
            isSystemGenerated: false
        });
        await statusLog.save();

        res.status(201).json({
            success: true,
            message: existingShipment ? 'Shipment updated successfully' : 'Shipment assigned successfully',
            shipment,
            order
        });

    } catch (err) {
        console.error('Assign shipment error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to assign shipment',
            error: err.message
        });
    }
});

// Get shipment by order ID
router.get('/order/:orderId', async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ order: req.params.orderId })
            .populate('order')
            .populate('assignedBy', 'username email role')
            .populate('lastUpdatedBy', 'username email role');

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found for this order' });
        }

        res.json({
            success: true,
            shipment
        });

    } catch (err) {
        console.error('Get shipment error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipment',
            error: err.message
        });
    }
});

// Update shipment live status
router.patch('/:shipmentId/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { liveStatus, currentLocation, notes } = req.body;

        const validStatuses = ['Preparing', 'On the way', 'Arrived at destination', 'Out for delivery', 'Delivered'];
        if (liveStatus && !validStatuses.includes(liveStatus)) {
            return res.status(400).json({ message: 'Invalid live status' });
        }

        const updateData = {
            lastUpdatedBy: req.user.id
        };

        if (liveStatus) updateData.liveStatus = liveStatus;
        if (currentLocation) updateData.currentLocation = currentLocation;
        if (notes) updateData.notes = notes;

        const shipment = await Shipment.findByIdAndUpdate(
            req.params.shipmentId,
            updateData,
            { new: true }
        ).populate('order').populate('lastUpdatedBy', 'username email');

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.json({
            success: true,
            message: 'Shipment status updated',
            shipment
        });

    } catch (err) {
        console.error('Update shipment status error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update shipment status',
            error: err.message
        });
    }
});

// Get all shipments (Admin)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const shipments = await Shipment.find()
            .populate('order')
            .populate('assignedBy', 'username email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: shipments.length,
            shipments
        });

    } catch (err) {
        console.error('Get all shipments error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipments',
            error: err.message
        });
    }
});

// Delete shipment (Admin only - use with caution)
router.delete('/:shipmentId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.shipmentId);

        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Delete associated photo
        deleteOldBusPhoto(shipment.busPhotoUrl);

        // Delete shipment
        await Shipment.findByIdAndDelete(req.params.shipmentId);

        // Update order status back to Packed
        await Order.findByIdAndUpdate(shipment.order, {
            status: 'Packed',
            busDetails: {}
        });

        res.json({
            success: true,
            message: 'Shipment deleted successfully'
        });

    } catch (err) {
        console.error('Delete shipment error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete shipment',
            error: err.message
        });
    }
});

module.exports = router;
