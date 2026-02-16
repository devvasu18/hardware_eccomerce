const Transaction = require('../models/Transaction');
const Refund = require('../models/Refund');
const Order = require('../models/Order');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Admin
exports.getTransactions = async (req, res) => {
    try {
        const { pageNumber, status, paymentMethod, startDate, endDate } = req.query;
        const pageSize = 20;
        const page = Number(pageNumber) || 1;

        const query = {};
        if (status) query.status = status;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        // Date Filter Logic
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate), // Start of the day
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // End of the day
            };
        } else if (startDate) {
            query.createdAt = {
                $gte: new Date(startDate)
            };
        }

        const count = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .populate('order', '_id totalAmount')
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ transactions, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Handle Payment Webhook (Mock)
// @route   POST /api/transactions/webhook
// @access  Public (Signature Verified)
exports.handlePaymentWebhook = async (req, res) => {
    try {
        // SECURITY: This endpoint was identified as vulnerable. 
        // It used a mock verification check and signature header not standard to PayU.
        // It is DISABLED for Production Security.
        // If a server-to-server webhook is needed from PayU, it must verify the 'hash' parameter 
        // using the merchant salt, similar to verifyPayment controller.

        console.warn('Security Alert: Attempt to access disabled webhook endpoint');
        return res.status(403).json({ message: 'Webhook endpoint is disabled for security.' });

        /*
        // ORIGINAL INSECURE CODE REMOVED
        */
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Webhook Failed' });
    }
};

// @desc    Process Refund
// @route   POST /api/transactions/refund
// @access  Admin
exports.processRefund = async (req, res) => {
    try {
        const { transactionId, amount, reason } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (transaction.status !== 'Success') {
            return res.status(400).json({ message: 'Cannot refund a failed or pending transaction' });
        }

        // Mock Gateway Refund Call
        // const refundResponse = await gateway.refunds.create({ charge: transaction.paymentId, amount });
        const mockRefundId = 'ref_' + Math.random().toString(36).substr(2, 9);

        // Create Refund Record
        const refund = await Refund.create({
            transaction: transaction._id,
            order: transaction.order,
            amount,
            reason,
            refundId: mockRefundId,
            status: 'Processed'
        });

        // Update Transaction Status (Partial or Full? Let's assume just logging refund for now)
        // Or update Order payment status to 'Refunded' if full amount?
        if (amount >= transaction.amount) {
            transaction.status = 'Refunded';
            await transaction.save();

            await Order.findByIdAndUpdate(transaction.order, { paymentStatus: 'Refunded' });
        }

        res.json({ message: 'Refund processed successfully', refund });
    } catch (error) {
        res.status(500).json({ message: 'Refund failed', error: error.message });
    }
};

// @desc    Manual Transaction Entry (For COD or Manual corrections)
// @route   POST /api/transactions
// @access  Admin
exports.createTransaction = async (req, res) => {
    try {
        const { orderId, userId, amount, method, status, paymentId } = req.body;

        const transaction = await Transaction.create({
            order: orderId,
            user: userId,
            paymentId: paymentId || 'tx_manual_' + Date.now(),
            paymentMethod: method,
            amount,
            status: status || 'Success',
            gatewayResponse: { manual_entry: true, by: req.user.username }
        });

        if (status === 'Success') {
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Paid', paymentMethod: method });
        }

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Creation failed', error: error.message });
    }
};
