const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const StatusLog = require('../models/StatusLog');
const User = require('../models/User');
const TaxCalculator = require('../utils/taxCalculator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Create Order (Supports both logged-in and guest users)
router.post('/create', optionalAuth, async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            billingAddress,
            paymentMethod,
            guestCustomer // { name, phone, email, address }
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Cannot create order.' });
        }

        if (!shippingAddress) {
            return res.status(400).json({ message: 'Shipping address is required.' });
        }

        // Determine if guest or logged-in user
        const isGuestOrder = !req.user;

        if (isGuestOrder) {
            // Validate guest details
            if (!guestCustomer || !guestCustomer.name || !guestCustomer.phone) {
                return res.status(400).json({
                    message: 'Guest orders require name and phone number.'
                });
            }
        }

        // Fetch user details for logs if logged in
        let dbUser = null;
        if (!isGuestOrder) {
            dbUser = await User.findById(req.user.id);
        }

        // Extract State from Shipping Address for tax calculation
        const state = shippingAddress.toLowerCase().includes('gujarat') ? 'Gujarat' : 'Other';

        let grandTotal = 0;
        let totalTax = 0;
        const processedItems = [];

        // Validate and process each item
        for (const item of items) {
            const product = await Product.findById(item.productId || item.product);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found: ${item.productId || item.product}`
                });
            }

            // Stock validation (skip for on-demand products)
            if (!product.isOnDemand) {
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
                    });
                }

                // Deduct stock atomically
                const updateResult = await Product.findOneAndUpdate(
                    {
                        _id: product._id,
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    { new: true }
                );

                if (!updateResult) {
                    return res.status(400).json({
                        message: `Stock changed during checkout for ${product.name}. Please try again.`
                    });
                }
            }

            // Calculate tax
            const priceAtBooking = item.price || item.priceAtBooking || product.discountedPrice;
            const taxRate = product.gstRate || 18;

            const taxDetails = TaxCalculator.calculateItemTax(
                priceAtBooking,
                item.quantity,
                state,
                product.hsnCode,
                taxRate
            );

            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                priceAtBooking,
                size: item.size,
                gstRate: taxRate,
                cgst: taxDetails.cgst,
                sgst: taxDetails.sgst,
                igst: taxDetails.igst,
                totalWithTax: taxDetails.total
            });

            grandTotal += taxDetails.total;
            totalTax += taxDetails.taxAmount;
        }

        // Generate invoice number
        const invoiceNumber = await TaxCalculator.generateInvoiceNumber(Order);

        // Create order object
        const orderData = {
            items: processedItems,
            totalAmount: Math.round(grandTotal),
            taxTotal: Math.round(totalTax),
            invoiceNumber,
            invoiceDate: new Date(),
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Pending',
            status: 'Order Placed', // Updated to new status flow
            isGuestOrder
        };

        // Add user or guest details
        if (isGuestOrder) {
            orderData.guestCustomer = {
                name: guestCustomer.name,
                phone: guestCustomer.phone,
                email: guestCustomer.email || '',
                address: guestCustomer.address || shippingAddress
            };
        } else {
            orderData.user = req.user.id;
        }

        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();

        // Create initial status log
        const statusLog = new StatusLog({
            order: savedOrder._id,
            status: 'Order Placed',
            updatedBy: isGuestOrder ? savedOrder._id : req.user.id, // Use order ID for guest orders
            updatedByName: isGuestOrder ? 'Customer (Guest)' : (dbUser ? (dbUser.username || dbUser.email) : 'Customer'),
            updatedByRole: isGuestOrder ? 'guest' : 'customer',
            notes: 'Order created successfully',
            isSystemGenerated: true
        });
        await statusLog.save();

        // Clear cart for logged-in users
        if (!isGuestOrder) {
            await Cart.findOneAndDelete({ user: req.user.id });
        }

        // Populate product details for response
        await savedOrder.populate('items.product');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: savedOrder,
            orderId: savedOrder._id,
            invoiceNumber: savedOrder.invoiceNumber
        });

    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: err.message
        });
    }
});

// Get all orders (Admin)
router.get('/admin/all', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff'];
        if (!adminRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const orders = await Order.find()
            .populate('user', 'username mobile email')
            .populate('items.product', 'name imageUrl')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Get all orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
    }
});

// Get user's orders (Customer)
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name imageUrl')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Get user orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
    }
});

// Get single order by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username mobile email')
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization check
        if (!order.isGuestOrder && req.user) {
            // Logged-in user can only see their own orders (unless admin)
            const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff'];
            if (order.user.toString() !== req.user.id && !adminRoles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.json({
            success: true,
            order
        });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ message: 'Failed to fetch order', error: err.message });
    }
});

// Update order status (Admin)
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['Order Placed', 'Packed', 'Assigned to Bus', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status,
                $push: {
                    logisticsUpdates: {
                        status,
                        updatedBy: req.user.id,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        ).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ message: 'Failed to update order', error: err.message });
    }
});

// Update payment status (Admin)
router.patch('/:id/payment', authenticateToken, async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'COD'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Payment status updated',
            order
        });
    } catch (err) {
        console.error('Update payment status error:', err);
        res.status(500).json({ message: 'Failed to update payment status', error: err.message });
    }
});

// Update logistics (Admin)
router.patch('/:id/logistics', authenticateToken, async (req, res) => {
    try {
        const { busNumber, driverContact, departureTime, expectedArrival } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Shipped',
                'busDetails.busNumber': busNumber,
                'busDetails.driverContact': driverContact,
                'busDetails.departureTime': departureTime,
                'busDetails.expectedArrival': expectedArrival,
                'busDetails.dispatchDate': new Date(),
                $push: {
                    logisticsUpdates: {
                        status: 'Shipped',
                        updatedBy: req.user.id,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Logistics updated',
            order
        });
    } catch (err) {
        console.error('Update logistics error:', err);
        res.status(500).json({ message: 'Failed to update logistics', error: err.message });
    }
});

// Cancel order
router.patch('/:id/cancel', optionalAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization
        if (!order.isGuestOrder && req.user) {
            if (order.user.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Can only cancel if not shipped
        if (['Assigned to Bus', 'Delivered'].includes(order.status)) {
            return res.status(400).json({
                message: 'Cannot cancel order that has been shipped or delivered'
            });
        }

        // Restore stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product && !product.isOnDemand) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } }
                );
            }
        }

        order.status = 'Cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (err) {
        console.error('Cancel order error:', err);
        res.status(500).json({ message: 'Failed to cancel order', error: err.message });
    }
});

module.exports = router;
