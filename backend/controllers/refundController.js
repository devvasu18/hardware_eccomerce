const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// @desc    Get all refund requests
// @route   GET /api/refunds
// @access  Admin
exports.getRefunds = async (req, res) => {
    try {
        const { status, pageNumber } = req.query;
        const page = Number(pageNumber) || 1;
        const pageSize = 20;

        const query = {};
        if (status) query.status = status;

        const count = await Refund.countDocuments(query);
        const refunds = await Refund.find(query)
            .populate('order', '_id totalAmount')
            .populate('user', 'username email')
            .populate('product', 'title image')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ refunds, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Request a refund (User Side)
// @route   POST /api/refunds/request
// @access  Private
exports.requestRefund = async (req, res) => {
    try {
        const { orderId, productId, amount, reason, description, images, bankDetails } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Logic check: Is user owner?
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if refund already exists for this item/order
        const existingRefund = await Refund.findOne({ order: orderId, product: productId, status: { $ne: 'Rejected' } });
        if (existingRefund) {
            return res.status(400).json({ message: 'Refund request already pending or processed' });
        }

        const refund = await Refund.create({
            order: orderId,
            user: req.user._id,
            product: productId || null, // If null, full order
            amount,
            reason,
            description,
            images,
            // Logic to determine gateway: usually same as order method
            gateway: order.paymentMethod === 'COD' ? 'Bank Transfer' : order.paymentMethod,
            bankAccountDetails: bankDetails,
            status: 'Pending'
        });

        res.status(201).json(refund);
    } catch (error) {
        res.status(500).json({ message: 'Request Failed', error: error.message });
    }
};

// @desc    Update Refund Status (Admin Action)
// @route   PUT /api/refunds/:id/status
// @access  Admin
exports.updateRefundStatus = async (req, res) => {
    try {
        const { status, adminNote, stockAdjustment } = req.body;
        const refund = await Refund.findById(req.params.id);

        if (!refund) return res.status(404).json({ message: 'Refund not found' });

        if (refund.status === 'Processed') {
            return res.status(400).json({ message: 'Already processed' });
        }

        refund.status = status;
        refund.adminNote = adminNote;
        refund.processedBy = req.user._id;

        if (status === 'Approved') {
            // -- Mock Gateway Call --
            if (refund.gateway === 'Razorpay' || refund.gateway === 'Stripe') {
                // Call Payment Gateway API here
                // const gatewayRes = await refundMoney(refund.amount, ...);
                refund.refundTransactionId = 'ref_gw_' + Date.now();
                refund.status = 'Processed'; // Auto process if gateway success
            } else if (refund.gateway === 'COD' || refund.gateway === 'Bank Transfer') {
                // For COD, admin manually transfers. Status stays Approved or moves to Processed if admin confirms transfer now.
                // Let's assume 'Approved' means "Ready for Payout", and admin marks "Processed" when money sent.
                // If the UI sends 'Processed', we assume money is sent.
            }

            // -- Stock Adjustment --
            if (stockAdjustment && refund.product) {
                await Product.findByIdAndUpdate(refund.product, { $inc: { stock: 1 } });
            }
        }

        await refund.save();

        res.json({ message: 'Refund updated', refund });
    } catch (error) {
        res.status(500).json({ message: 'Update Failed', error: error.message });
    }
};
