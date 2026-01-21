const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all users
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Create new user (Admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { username, mobile, password, address, wholesaleDiscount } = req.body;

        const existing = await User.findOne({ mobile });
        if (existing) return res.status(400).json({ message: 'User already exists with this mobile number' });

        const discount = Number(wholesaleDiscount) || 0;
        const customerType = discount > 0 ? 'wholesale' : 'regular';

        const newUser = new User({
            username,
            mobile,
            password,
            address,
            wholesaleDiscount: discount,
            customerType,
            role: 'customer' // Default role
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Update user
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.role = req.body.role || user.role;
            user.tallyLedgerName = req.body.tallyLedgerName || user.tallyLedgerName;
            user.username = req.body.username || user.username;
            user.mobile = req.body.mobile || user.mobile;

            // Handle Wholesale Logic
            if (req.body.wholesaleDiscount !== undefined) {
                const discount = Number(req.body.wholesaleDiscount);
                user.wholesaleDiscount = discount;

                if (discount > 0) {
                    user.customerType = 'wholesale';
                } else {
                    user.customerType = 'regular';
                }
            } else if (req.body.customerType) {
                // If manually changing customerType without changing discount
                user.customerType = req.body.customerType;
                // If changing AWAY from wholesale, should we reset discount? 
                // Let's keep it simple: if manually setting type, trust the admin.
                // But if they set to wholesale, maybe discount stays 0 until set? 
                // The requirement is specific about the relationship "If discount > 0 -> Wholesale".
                // I will prioritize the discount logic if discount is passed.
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                role: updatedUser.role,
                customerType: updatedUser.customerType,
                tallyLedgerName: updatedUser.tallyLedgerName,
                wholesaleDiscount: updatedUser.wholesaleDiscount
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
