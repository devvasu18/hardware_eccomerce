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

        const { orderId } = req.body; // Ignore client amount

        // 1. Fetch Order to get secure Amount
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Security Check: If order belongs to a user, requester MUST be that user
        if (order.user) {
            if (!req.user || req.user._id.toString() !== order.user.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized to pay for this order' });
            }
        }

        const amount = order.totalAmount; // Trust source of truth

        // Generate unique transaction ID
        const txnid = `TXN${Date.now()}`;

        // BYPASS: Direct Success Simulation for Manual Testing
        // Instead of returning PayU params, we will tell frontend to "verify" immediately
        // Note: Frontend must be ready to assume success if it sees this specific flag or handling
        // OR we just return dummy data that points to success URL directly?

        // Actually, user asked to "just payment directly done". 
        // Best way: Update order STATUS here directly and return "mock_success" to frontend so it redirects.

        order.paymentStatus = 'Paid'; // Changed for immediate effect
        order.status = 'Processing'; // Consistency with verifyPayment
        order.paymentDetails = { provider: 'Manual_Bypass', transactionId: txnid };
        await order.save();

        // Clear Cart in bypass mode
        if (order.user) {
            const Cart = require('../models/Cart');
            await Cart.findOneAndDelete({ user: order.user });
        }

        // Return dummy param that frontend might use, or just success
        // If frontend expects PayU form, this might break UI. 
        // Assuming strict "remove it and show directly payment done" implies backend action is key.

        res.json({
            success: true,
            bypass: true, // Frontend clue
            paymentUrl: `${process.env.FRONTEND_URL}/payment/success`, // Redirect direct
            params: {
                // Dummy params to prevent frontend crash if it tries to destructure
                key: 'dummy', hash: 'dummy'
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

        if (generatedHash === hash) {
            // Hash is valid
            if (status === 'success') {
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

                        order.paymentStatus = 'Completed';
                        order.paymentDetails = {
                            provider: 'PayU',
                            transactionId: mihpayid,
                            txnId: txnid
                        };
                        order.status = 'Processing';
                        await order.save();

                        // Clear Cart after successful payment
                        if (order.user) {
                            const Cart = require('../models/Cart');
                            await Cart.findOneAndDelete({ user: order.user });
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
