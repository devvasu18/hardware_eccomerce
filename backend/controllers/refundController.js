const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const tallyService = require('../services/tallyService');

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
        const { orderId, productId, itemId, amount, quantity, reason, description, images, bankDetails } = req.body;
        const refundQty = quantity || 1;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Logic check: Is user owner?
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Identify the specific item
        let orderItem;
        if (itemId) {
            orderItem = order.items.id(itemId);
        } else if (productId) {
            orderItem = order.items.find(i => i.product.toString() === productId);
        }

        if (!orderItem) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        // Validate Quantity
        if (refundQty > orderItem.quantity) {
            return res.status(400).json({ message: 'Cannot refund more than ordered quantity' });
        }

        // Validate Amount (Fraud Prevention)
        // items have totalWithTax calculated. 
        // We allow some buffer for shipping? usually not for partial.
        // Cap at proportional value.
        const maxRefundable = (orderItem.totalWithTax / orderItem.quantity) * refundQty;
        if (amount > maxRefundable + 1) { // +1 for floating point safety
            return res.status(400).json({ message: `Refund amount exceeds item value (Max: ${maxRefundable})` });
        }

        // Check if refund already exists for this item/order
        const existingRefund = await Refund.findOne({
            order: orderId,
            $or: [
                { product: orderItem.product, variationId: orderItem.variationId }, // Match specific variant if possible
                { product: orderItem.product, status: { $ne: 'Rejected' }, modelId: orderItem.modelId }
            ],
            status: { $ne: 'Rejected' }
        });

        if (existingRefund) {
            // Allow multiple partial refunds? Complex. For now, block if ANY refund pending for this item.
            return res.status(400).json({ message: 'Refund request already pending or processed for this item' });
        }

        // Check if product is returnable
        if (orderItem.product) {
            const product = await Product.findById(orderItem.product);
            if (!product) return res.status(404).json({ message: 'Product not found' });

            if (product.isReturnable === false) {
                return res.status(400).json({ message: 'This product is not eligible for returns/refunds.' });
            }

            // Check Return Window
            const windowDays = product.returnWindow || 7;
            const bookingDate = new Date(order.createdAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > windowDays) {
                return res.status(400).json({ message: `The return window for this product (${windowDays} days) has expired.` });
            }
        }

        const refund = await Refund.create({
            order: orderId,
            user: req.user._id,
            product: orderItem.product,
            modelId: orderItem.modelId,
            variationId: orderItem.variationId,
            amount,
            quantity: refundQty,
            reason,
            description,
            images,
            // Logic to determine gateway: usually same as order method
            gateway: (order.paymentDetails && order.paymentDetails.provider)
                ? order.paymentDetails.provider
                : (order.paymentMethod === 'COD' ? 'Bank Transfer' : order.paymentMethod),
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
        const { status, adminNote, stockAdjustment, refundTransactionId, refundMethod, refundProofImage, refundDate } = req.body;
        const refund = await Refund.findById(req.params.id).populate('order');

        if (!refund) return res.status(404).json({ message: 'Refund not found' });

        if (refund.status === 'Processed') {
            return res.status(400).json({ message: 'Already processed' });
        }

        refund.status = status;
        refund.adminNote = adminNote;
        refund.processedBy = req.user._id;

        // Save Manual Refund Details if provided
        if (refundTransactionId) refund.refundTransactionId = refundTransactionId;
        if (refundMethod) refund.refundMethod = refundMethod;
        if (refundProofImage) refund.refundProofImage = refundProofImage;
        if (refundDate) refund.refundDate = refundDate;

        // Auto-set refund date if processed and not provided
        if (status === 'Processed' && !refund.refundDate) {
            refund.refundDate = new Date();
        }

        if (status === 'Approved' || status === 'Processed') {
            // -- Mock Gateway Call --
            if (refund.gateway === 'Razorpay' || refund.gateway === 'Stripe' || refund.gateway === 'PayU' || refund.gateway === 'Online') {
                // Call Payment Gateway API here
                // const gatewayRes = await refundMoney(refund.amount, ...);
                console.log(`Processing automatic refund via ${refund.gateway} for amount ${refund.amount}`);

                if (status === 'Approved') { // Prevent double status set if already Processed
                    refund.refundTransactionId = 'ref_gw_' + Date.now();
                    refund.status = 'Processed';
                }
            } else if (refund.gateway === 'COD' || refund.gateway === 'Bank Transfer') {
                // For COD, admin manually transfers. Status stays Approved or moves to Processed if admin confirms transfer now.
                // Let's assume 'Approved' means "Ready for Payout", and admin marks "Processed" when money sent.
                // If the UI sends 'Processed', we assume money is sent.
            }

            // -- Update Order Item Status --
            if (refund.order && refund.product) {
                await Order.findOneAndUpdate(
                    { _id: refund.order, 'items.product': refund.product },
                    {
                        $set: { 'items.$.status': 'Refunded' },
                        $inc: { 'items.$.quantityReturned': refund.quantity || 0 }
                    }
                );
            } else if (refund.order && !refund.product) {
                // Full order refund
                await Order.findByIdAndUpdate(refund.order, {
                    paymentStatus: 'Refunded',
                    status: 'Cancelled'
                });

                // Sync Cancellation to Tally
                tallyService.syncOrderToTally(refund.order)
                    .then(res => console.log('Tally Sync on Full Refund:', res))
                    .catch(err => console.error('Tally Sync Error:', err));
            }

            // -- Stock Adjustment --
            if (stockAdjustment && refund.product) {
                if (refund.modelId) {
                    if (refund.variationId) {
                        await Product.findOneAndUpdate(
                            { _id: refund.product, 'models._id': refund.modelId },
                            { $inc: { 'models.$[m].variations.$[v].stock': refund.quantity || 1 } },
                            { arrayFilters: [{ 'm._id': refund.modelId }, { 'v._id': refund.variationId }] }
                        );
                    }
                } else if (refund.variationId) {
                    await Product.findOneAndUpdate(
                        { _id: refund.product, 'variations._id': refund.variationId },
                        { $inc: { 'variations.$.stock': refund.quantity || 1 } }
                    );
                } else {
                    await Product.findByIdAndUpdate(refund.product, { $inc: { stock: refund.quantity || 1 } });
                }
            }
        }

        await refund.save();

        res.json({ message: 'Refund updated', refund });
    } catch (error) {
        res.status(500).json({ message: 'Update Failed', error: error.message });
    }
};
