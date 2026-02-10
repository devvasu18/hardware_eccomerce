const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendWhatsApp = require('../utils/sendWhatsApp');

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
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) return res.status(400).json({ message: 'User already exists with this mobile number' });

        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) return res.status(400).json({ message: 'User already exists with this email address' });
        }

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
                savedAddresses: savedUser.savedAddresses,
                mobile: savedUser.mobile
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
                savedAddresses: user.savedAddresses,
                mobile: user.mobile
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
        const { email, mobile } = req.body;
        let user;

        if (email) {
            user = await User.findOne({ email });
        } else if (mobile) {
            user = await User.findOne({ mobile });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with these credentials.' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        try {
            const { sendPasswordResetRequestNotification } = require('../utils/authNotifications');
            await sendPasswordResetRequestNotification(user, resetUrl);
            res.status(200).json({ success: true, data: 'If an account exists, a reset link has been sent.' });
        } catch (notifErr) {
            console.error('[Auth] Error sending reset link:', notifErr);
            // Even if notification fails, we return success to prevent user enumeration
            res.status(200).json({ success: true, data: 'If an account exists, a reset link has been sent.' });
        }

    } catch (err) {
        console.error("Forgot Password Error:", err);
        // Even on error, return success to avoid enumeration
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Check Reset Token Validity
// @route   GET /api/auth/resetpassword/:resettoken/check
// @access  Public
router.get('/resetpassword/:resettoken/check', async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ valid: false, message: 'Invalid or expired token' });
        }

        res.status(200).json({ valid: true });
    } catch (err) {
        res.status(500).json({ valid: false, message: 'Server Error' });
    }
});

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', authLimiter, [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')

], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        }).select('+password +passwordHistory');

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const newPassword = req.body.password;

        // Prevent reuse of last 5 passwords
        if (user.passwordHistory && user.passwordHistory.length > 0) {
            for (let history of user.passwordHistory) {
                const isMatch = await bcrypt.compare(newPassword, history.password);
                if (isMatch) {
                    return res.status(400).json({ message: 'New password cannot be the same as your recent passwords.' });
                }
            }
        }

        // Add current password to history
        if (!user.passwordHistory) user.passwordHistory = [];
        // user.password is the old hashed password (because we selected +password)
        if (user.password) {
            user.passwordHistory.unshift({ password: user.password, changedAt: Date.now() });
        }
        if (user.passwordHistory.length > 5) {
            user.passwordHistory = user.passwordHistory.slice(0, 5);
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.passwordChangedAt = Date.now();

        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        // Send Confirmation Notification (Disabled)
        /*
        try {
            const confirmMsg = `Hello ${user.username},\n\nYour password has been successfully reset. If you did not perform this action, please contact support immediately.`;

            if (user.email) {
                // Background send (no await)
                sendEmail({
                    email: user.email,
                    subject: 'Password Reset Successful',
                    message: confirmMsg,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #10B981;">Password Changed</h2>
                            <p>Hello <strong>${user.username}</strong>,</p>
                            <p>Your password has been successfully reset.</p>
                            <div style="margin-top: 20px; padding: 15px; background-color: #fee2e2; border-radius: 5px;">
                                <p style="color: #ef4444; font-weight: bold; margin: 0;">If you did not perform this action, please contact support immediately.</p>
                            </div>
                        </div>
                    `
                }).catch(err => console.error('Reset Confirm Email Error:', err));
            }

            if (user.mobile) {
                sendWhatsApp(user.mobile, `*Security Alert: Password Changed*\n\nHello ${user.username},\n\nYour password has been successfully reset.\n\nIf you did not do this, please contact support immediately.`).catch(err => console.error('Reset Confirm WA Error:', err));
            }
        } catch (error) {
            console.error('Notification Error:', error);
        }
        */

        // Send Password Reset Success Notification (Dynamic)
        try {
            const { sendPasswordResetSuccessNotification } = require('../utils/authNotifications');
            const SystemSettings = require('../models/SystemSettings');

            const settings = await SystemSettings.findById('system_settings');

            if (settings?.passwordResetNotificationsEnabled) {
                await sendPasswordResetSuccessNotification({
                    username: user.username,
                    email: user.email,
                    mobile: user.mobile
                });
                console.log('[Auth] Password reset success notification sent');
            }
        } catch (notifError) {
            console.error('[Auth] Password reset notification error:', notifError);
            // Don't fail the password reset if notification fails
        }

        res.status(200).json({ success: true, token, message: 'Password updated successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

const { protect } = require('../middleware/authMiddleware');
const BlacklistedToken = require('../models/BlacklistedToken');
const { logAction } = require('../utils/auditLogger');

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, authLimiter, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Prevent reuse of last 5 passwords
        if (user.passwordHistory && user.passwordHistory.length > 0) {
            for (let history of user.passwordHistory) {
                const isMatch = await bcrypt.compare(newPassword, history.password);
                if (isMatch) {
                    return res.status(400).json({ message: 'New password cannot be the same as your recent passwords.' });
                }
            }
        }

        // Add current password to history
        // user.password is already hashed
        if (!user.passwordHistory) user.passwordHistory = [];
        user.passwordHistory.unshift({ password: user.password, changedAt: Date.now() });
        if (user.passwordHistory.length > 5) {
            user.passwordHistory = user.passwordHistory.slice(0, 5); // Keep last 5
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        user.passwordChangedAt = Date.now();
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Issue new token for current session
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        await logAction({ action: 'CHANGE_PASSWORD', req, targetResource: 'User', targetId: user._id, details: { changedAt: user.passwordChangedAt } });

        // Send Confirmation Notification (Disabled)
        /*
        try {
            const confirmMsg = `Hello ${user.username},\n\nYour password has been changed successfully. If you did not perform this action, please contact support immediately.`;

            if (user.email) {
                sendEmail({
                    email: user.email,
                    subject: 'Password Changed Successfully',
                    message: confirmMsg,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #10B981;">Password Updated</h2>
                            <p>Hello <strong>${user.username}</strong>,</p>
                            <p>Your password has been successfully changed.</p>
                            <p style="color: #ef4444; font-weight: bold; margin-top: 20px;">If you did not perform this action, please contact support immediately.</p>
                        </div>
                    `
                }).catch(err => console.error('ChangePwd Email Error:', err));
            }

            if (user.mobile) {
                sendWhatsApp(user.mobile, `*Security Alert: Password Changed*\n\nHello ${user.username},\n\nYour password has been successfully updated.\n\nIf you did not do this, please contact support immediately.`).catch(err => console.error('ChangePwd WA Error:', err));
            }
        } catch (error) {
            console.error('ChangePwd Notification Error:', error);
        }
        */

        res.json({ success: true, message: 'Password changed successfully', token });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

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


// @desc    Request Mobile Change (sends email)
// @route   POST /api/auth/request-mobile-change
// @access  Private
router.post('/request-mobile-change', protect, authLimiter, async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is set
        if (!user.email) {
            return res.status(400).json({ message: 'Email is not set for this account. Please add an email address first.' });
        }

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Generate token
        const changeToken = user.getMobileChangeToken();
        await user.save({ validateBeforeSave: false });

        // Create change URL
        const changeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/change-mobile/${changeToken}`;

        // Send Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Mobile Number Change Request',
                message: `You requested to change your mobile number. Please click the link below to proceed:\n\n${changeUrl}\n\nThis link will expire in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #3b82f6;">Change Mobile Number</h2>
                        <p>Hello <strong>${user.username}</strong>,</p>
                        <p>You requested to change your registered mobile number.</p>
                        <p>Please click the button below to proceed. This link is valid for 10 minutes.</p>
                        <a href="${changeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Change Mobile Number</a>
                        <p style="margin-top: 20px; font-size: 0.9em; color: #666;">If you did not request this, please ignore this email and your mobile number will remain unchanged.</p>
                    </div>
                `
            });

            res.status(200).json({ success: true, message: `Verification link sent to ${user.email}` });
        } catch (emailErr) {
            console.error('Email send error:', emailErr);
            user.mobileChangeToken = undefined;
            user.mobileChangeExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @desc    Change Mobile Number via Token
// @route   PUT /api/auth/change-mobile/:token
// @access  Public
router.put('/change-mobile/:token', authLimiter, [
    body('newMobile').matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const mobileChangeToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            mobileChangeToken,
            mobileChangeExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const { newMobile } = req.body;

        // Check if new mobile is already taken
        const existingUser = await User.findOne({ mobile: newMobile });
        if (existingUser) {
            return res.status(400).json({ message: 'This mobile number is already in use by another account' });
        }

        user.mobile = newMobile;
        user.mobileChangeToken = undefined;
        user.mobileChangeExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Mobile number updated successfully. Please login again.' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;

