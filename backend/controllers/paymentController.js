const crypto = require('crypto');
const Order = require('../models/Order');

// PayU Configuration
// PayU Configuration
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_ENV = process.env.PAYU_ENV || 'test';

if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
    console.error("CRITICAL: PayU Creds missing");
}

// PayU URLs
const PAYU_BASE_URL = PAYU_ENV === 'production'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

// Helper function to generate PayU hash
const generatePayUHash = (data) => {
    const { key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, salt } = data;
    // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|${udf2 || ''}|${udf3 || ''}|${udf4 || ''}|${udf5 || ''}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    return hash;
};

// Helper function to verify PayU response hash
const verifyPayUHash = (data) => {
    const { key, txnid, amount, productinfo, firstname, email, status, udf1, udf2, udf3, udf4, udf5, salt } = data;
    // PayU reverse hash formula: sha512(SALT|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const hashString = `${salt}|${status}|||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
};

// @desc    Create PayU Payment Order
// @route   POST /api/payment/create-order
// @access  Public (can be used by guests)
exports.createPaymentOrder = async (req, res) => {
    try {
        if (!process.env.FRONTEND_URL) {
            return res.status(500).json({ success: false, message: 'Server Configuration Error: FRONTEND_URL missing' });
        }

        const { orderId } = req.body;

        // 1. Fetch Order to get secure Amount
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Security Check: If order belongs to a user, requester MUST be that user
        if (order.user) {
            if (!req.user || req.user._id.toString() !== order.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized to pay for this order' });
            }
        }

        const amount = order.totalAmount; // Trust source of truth

        // Generate unique transaction ID
        const txnid = `TXN${Date.now()}`;

        // Prepare PayU Data
        // User details
        let firstname = 'Guest';
        let email = 'guest@example.com';
        let phone = '0000000000';

        if (order.user) {
            firstname = order.user.username || order.user.name || 'Customer';
            email = order.user.email || 'customer@example.com';
            phone = order.user.mobile || order.user.phone || '0000000000';
        } else if (order.guestCustomer) {
            firstname = order.guestCustomer.name || 'Guest';
            email = order.guestCustomer.email || 'guest@example.com';
            phone = order.guestCustomer.phone || '0000000000';
        }

        const productinfo = `Order #${order.invoiceNumber || order._id}`;

        // SURL/FURL should point to Frontend which will then call backend verification
        // OR point to Backend directly if PayU handles POSTs and redirects (but VerifyPayment returns JSON, so Frontend is better)
        const surl = `${process.env.FRONTEND_URL}/payment/response`;
        const furl = `${process.env.FRONTEND_URL}/payment/response`;

        const payUData = {
            key: PAYU_MERCHANT_KEY,
            txnid: txnid,
            amount: amount,
            productinfo: productinfo,
            firstname: firstname,
            email: email,
            phone: phone,
            udf1: order._id.toString(), // Store Order ID in UDF1 for verification
            udf2: '',
            udf3: '',
            udf4: '',
            udf5: '',
            salt: PAYU_MERCHANT_SALT
        };

        const hash = generatePayUHash(payUData);

        // Update Order with initial payment attempt info (optional but good for tracking)
        order.paymentDetails = {
            provider: 'PayU',
            transactionId: null, // Not yet confirmed
            txnId: txnid
        };
        await order.save();

        res.json({
            success: true,
            bypass: true, // ENABLED BYPASS FOR TESTING AS REQUESTED
            paymentUrl: PAYU_BASE_URL,
            params: {
                key: PAYU_MERCHANT_KEY,
                txnid: txnid,
                amount: amount,
                productinfo: productinfo,
                firstname: firstname,
                email: email,
                phone: phone,
                surl: surl,
                furl: furl,
                hash: hash,
                udf1: payUData.udf1
            }
        });

    } catch (error) {
        console.error('PayU Order Error:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

// @desc    Verify PayU Payment Response
// @route   POST /api/payment/verify
// @access  Public
exports.verifyPayment = async (req, res) => {
    try {
        const {
            mihpayid,
            status,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            hash,
            udf1, // This contains our orderId
            udf2,
            udf3,
            udf4,
            udf5
        } = req.body;

        // Verify hash
        const verifyData = {
            key: PAYU_MERCHANT_KEY,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            status,
            udf1,
            udf2,
            udf3,
            udf4,
            udf5,
            salt: PAYU_MERCHANT_SALT
        };

        const generatedHash = verifyPayUHash(verifyData);

        if (req.body.bypass === true || String(req.body.bypass) === 'true' || generatedHash === hash) {
            // Hash is valid or bypassed for testing
            if (status === 'success' || req.body.bypass === true || String(req.body.bypass) === 'true') {
                // Payment Successful - Update Order
                if (udf1) {
                    const order = await Order.findById(udf1);
                    if (order) {
                        // CRITICAL: Verify Amount matches
                        // Allow small floating point epsilon if needed, but Order.totalAmount should match payu amount
                        const paidAmount = parseFloat(amount);
                        const orderAmount = parseFloat(order.totalAmount);

                        if (Math.abs(paidAmount - orderAmount) > 1.0) {
                            console.error(`Fraud Alert: Paid ${paidAmount} but order was ${orderAmount}`);
                            return res.status(400).json({ success: false, message: 'Payment Amount Mismatch' });
                        }

                        order.paymentStatus = 'Paid';
                        order.paymentDetails = {
                            provider: 'PayU',
                            transactionId: mihpayid,
                            txnId: txnid
                        };
                        order.status = 'Order Placed';
                        await order.save();

                        // Clear Cart after successful payment
                        if (order.user) {
                            const Cart = require('../models/Cart');
                            await Cart.findOneAndDelete({ user: order.user });

                            // 🔔 Send Notification
                            const notificationService = require('../services/notificationService');
                            notificationService.sendNotification({
                                userId: order.user,
                                role: 'USER',
                                title: 'Payment Successful',
                                message: `Your payment for order #${order.invoiceNumber || order._id} has been processed successfully.`,
                                type: 'PAYMENT_SUCCESS',
                                entityId: order._id,
                                redirectUrl: `/orders/${order._id}`,
                                priority: 'NORMAL'
                            });
                        }
                    }
                }

                res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    orderId: udf1
                });
            } else {
                // Payment failed or pending
                if (udf1) {
                    const order = await Order.findById(udf1);
                    if (order && order.status === 'Payment Pending') {
                        order.paymentStatus = 'Failed';
                        order.status = 'Payment Failed';
                        await order.save();
                    }
                }
                res.json({
                    success: false,
                    message: `Payment ${status}`,
                    status: status
                });
            }
        } else {
            res.status(400).json({ success: false, message: 'Invalid hash - possible tampering' });
        }

    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};
