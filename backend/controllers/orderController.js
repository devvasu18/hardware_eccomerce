const Order = require('../models/Order');
const StatusLog = require('../models/StatusLog');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create a new order
// @route   POST /api/orders/create
// @access  Public (supports both authenticated and guest users)
exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, billingAddress, paymentMethod, guestCustomer } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in order' });
        }

        if (!shippingAddress || !billingAddress) {
            return res.status(400).json({ success: false, message: 'Shipping and billing addresses are required' });
        }

        // Calculate order total
        let orderTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
            }

            const itemTotal = item.price * item.quantity;
            orderTotal += itemTotal;

            orderItems.push({
                product: item.productId,
                quantity: item.quantity,
                priceAtBooking: item.price,  // Changed from 'price' to 'priceAtBooking'
                size: item.size || null
            });
        }

        // Calculate tax (18% GST)
        const taxAmount = Math.round(orderTotal * 0.18);
        const grandTotal = orderTotal + taxAmount;

        // Create order object
        const orderData = {
            items: orderItems,
            shippingAddress,
            billingAddress,
            paymentMethod: paymentMethod || 'Online',
            paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Pending',
            status: 'Order Placed',  // Changed from 'Pending' to 'Order Placed' to match enum
            totalAmount: grandTotal,  // Changed from 'total' to 'totalAmount'
            taxTotal: taxAmount,      // Changed from 'tax' to 'taxTotal'
            isGuestOrder: false       // Will be set to true for guest orders
        };

        // Handle authenticated vs guest user
        if (req.user) {
            // Authenticated user
            orderData.user = req.user._id;
            orderData.isGuestOrder = false;
        } else if (guestCustomer) {
            // Guest user
            orderData.guestCustomer = {
                name: guestCustomer.name,
                phone: guestCustomer.phone,
                email: guestCustomer.email || '',
                address: guestCustomer.address || shippingAddress
            };
            orderData.isGuestOrder = true;
        } else {
            return res.status(400).json({ success: false, message: 'User authentication or guest details required' });
        }

        // Create the order
        const order = await Order.create(orderData);

        // Create initial status log (system-generated, no user reference needed)
        const statusLogData = {
            order: order._id,
            status: 'Order Placed',
            updatedByName: 'System',
            updatedByRole: 'system',
            notes: 'Order created successfully',
            isSystemGenerated: true
        };

        // Only add updatedBy if we have a user
        if (req.user) {
            statusLogData.updatedBy = req.user._id;
        }

        await StatusLog.create(statusLogData);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId: order._id,
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                total: order.totalAmount,  // Map back to 'total' for frontend
                status: order.status
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

// @desc    Get all orders with optional filtering
// @route   GET /api/orders
// @access  Admin
exports.getOrders = async (req, res) => {
    try {
        const { keyword, status, paymentStatus, pageNumber } = req.query;
        const pageSize = 20;
        const page = Number(pageNumber) || 1;

        const query = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (keyword) {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(keyword);
            if (isObjectId) {
                query._id = keyword;
            }
        }

        const count = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'username email mobile')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ orders, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Admin
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email mobile image')
            .populate('items.product', 'title image');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Fetch Status Timeline
        const timeline = await StatusLog.find({ order: req.params.id }).sort({ timestamp: -1 });

        res.json({ order, timeline });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, description, notifyUser, busDetails } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;

        // Handling Logic for "Assigned to Bus"
        if (status === 'Assigned to Bus' && busDetails) {
            order.busDetails = {
                busNumber: busDetails.busNumber,
                driverContact: busDetails.driverContact,
                departureTime: busDetails.departureTime,
                expectedArrival: busDetails.expectedArrival,
                dispatchDate: busDetails.dispatchDate,
                // Handle image if uploaded? Usually file upload middleware handles it
                // If busPhoto comes as string (url), save it.
                busPhoto: busDetails.busPhoto || order.busDetails?.busPhoto
            };
        }

        // Handle Image Upload logic if using middleware
        if (req.file) {
            // If the route used upload middleware and a file was sent
            if (status === 'Assigned to Bus') {
                if (!order.busDetails) order.busDetails = {};
                order.busDetails.busPhoto = req.file.path.replace(/\\/g, '/');
            }
        }

        await order.save();

        // Create Status Log
        await StatusLog.create({
            order: order._id,
            status: status,
            updatedBy: req.user._id,
            updatedByName: req.user.username,
            updatedByRole: req.user.role,
            notes: description || `Status changed from ${oldStatus} to ${status}`
        });

        res.json({ message: 'Status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// @desc    Cancel Order
// @route   POST /api/orders/:id/cancel
// @access  Admin
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        order.status = 'Cancelled';
        await order.save();

        await StatusLog.create({
            order: order._id,
            status: 'Cancelled',
            updatedBy: req.user._id,
            updatedByName: req.user.username,
            updatedByRole: req.user.role,
            notes: req.body.reason || 'Order cancelled by admin'
        });

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Cancellation failed', error: error.message });
    }
};
