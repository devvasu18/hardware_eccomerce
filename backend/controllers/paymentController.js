const crypto = require('crypto');
const Order = require('../models/Order');

// PayU Configuration
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || 'j2VXgX';
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || 'ulVg2SyeQvzmMK9VhinC5u3fkqBJfAT8';
const PAYU_ENV = process.env.PAYU_ENV || 'test';

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
    console.log('PayU Hash String:', hashString);
    console.log('Generated Hash:', hash);
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
        const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;

        // Generate unique transaction ID
        const txnid = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Prepare payment data
        const paymentData = {
            key: PAYU_MERCHANT_KEY,
            txnid: txnid,
            amount: amount.toString(),
            productinfo: `Order #${orderId}`,
            firstname: customerName || 'Customer',
            email: customerEmail || 'customer@example.com',
            phone: customerPhone || '',
            salt: PAYU_MERCHANT_SALT,
            surl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
            furl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`,
            udf1: orderId, // Store orderId for reference
            udf2: '',
            udf3: '',
            udf4: '',
            udf5: ''
        };

        // Generate hash
        const hash = generatePayUHash(paymentData);

        // Return payment parameters to frontend
        res.json({
            success: true,
            paymentUrl: PAYU_BASE_URL,
            params: {
                key: paymentData.key,
                txnid: paymentData.txnid,
                amount: paymentData.amount,
                productinfo: paymentData.productinfo,
                firstname: paymentData.firstname,
                email: paymentData.email,
                phone: paymentData.phone,
                surl: paymentData.surl,
                furl: paymentData.furl,
                hash: hash,
                udf1: paymentData.udf1,
                udf2: paymentData.udf2,
                udf3: paymentData.udf3,
                udf4: paymentData.udf4,
                udf5: paymentData.udf5
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
                        order.paymentStatus = 'Completed';
                        order.paymentDetails = {
                            provider: 'PayU',
                            transactionId: mihpayid,
                            txnId: txnid
                        };
                        order.status = 'Processing';
                        await order.save();
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
