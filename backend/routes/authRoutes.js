const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'chamunda_secret_key_123';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, mobile, password, address, email, role } = req.body;

        // Check existing
        const existing = await User.findOne({ mobile });
        if (existing) return res.status(400).json({ message: 'User already exists with this mobile number' });

        // In production, HASH PASSWORD HERE using bcrypt
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            mobile,
            password: password,
            address,
            email,
            role: role || 'customer'
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
                wholesaleDiscount: savedUser.wholesaleDiscount
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Check password (Plaintext comparison for now as per Seed data)
        if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                customerType: user.customerType,
                wholesaleDiscount: user.wholesaleDiscount
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

module.exports = router;
