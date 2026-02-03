const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate Limiter: 10 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Register
// Register
router.post('/register', authLimiter, [
    body('username').notEmpty().withMessage('Username is required').trim().escape(),
    body('mobile').matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Invalid email address').normalizeEmail()
], async (req, res) => {
    // Check Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    try {
        const { username, mobile, password, address, email } = req.body;

        // Check existing
        const existing = await User.findOne({ mobile });
        if (existing) return res.status(400).json({ message: 'User already exists with this mobile number' });

        const newUser = new User({
            username,
            mobile,
            password, // Hook will hash this
            address,
            email,
            role: 'customer' // Enforce customer role for public registration
        });

        const savedUser = await newUser.save();

        // Auto login
        const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                role: savedUser.role,
                customerType: savedUser.customerType,
                wholesaleDiscount: savedUser.wholesaleDiscount,
                savedAddresses: savedUser.savedAddresses
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Login
// Login
router.post('/login', authLimiter, [
    // body('mobile').notEmpty().withMessage('Mobile number is required'), // Relaxed for Email login
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
        const { mobile, password, email } = req.body;

        let query = {};
        if (mobile) query.mobile = mobile;
        else if (email) query.email = email;
        else return res.status(400).json({ message: 'Mobile or Email is required' });

        const user = await User.findOne(query).select('+password');
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (user.isActive === false) return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });

        const isMatch = await user.matchPassword(password);

        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                customerType: user.customerType,
                wholesaleDiscount: user.wholesaleDiscount,
                savedAddresses: user.savedAddresses
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add Saved Address
router.post('/address', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newAddress = {
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            landmark: req.body.landmark,
            isDefault: req.body.isDefault || false
        };

        if (!user.savedAddresses) user.savedAddresses = [];

        // If setting as default, unset others // Optional logic, user didn't explicitly ask for default management but implied "saved address" list
        if (newAddress.isDefault) {
            user.savedAddresses.forEach(a => a.isDefault = false);
        }

        user.savedAddresses.push(newAddress);

        await user.save();
        res.json({ success: true, savedAddresses: user.savedAddresses });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Update logic to parse token correctly in /me as well if needed, but I'll trust existing code there for now.
// Get Current User (Me) - Fixing the token parsing slightly to be robust
router.get('/me', async (req, res) => {
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', authLimiter, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
                html: `<h1>Passowrd Reset</h1><p>Click details below to reset password:</p><a href="${resetUrl}">Reset Password</a>`
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', authLimiter, async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ success: true, token, message: 'Password updated successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

const { protect } = require('../middleware/authMiddleware');
const BlacklistedToken = require('../models/BlacklistedToken');

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                user.password = req.body.password;
            }
            if (req.body.mobile) {
                user.mobile = req.body.mobile;
            }

            // Prevent role update here

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                role: updatedUser.role,
                token: jwt.sign({ id: updatedUser._id, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' })
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @desc    Logout (Blacklist Token)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        // Calculate expiration (standard 7 days from verify or just set strict TTL)
        // For simplicity, we just blacklist it. The db model has TTL 7 days usually or we set it.
        // We'll set it to expire from DB after 7 days automatically to keep DB clean.

        await BlacklistedToken.create({
            token: token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Days
        });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Logout failed', error: err.message });
    }
});

module.exports = router;
