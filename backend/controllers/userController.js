const User = require('../models/User');
const Order = require('../models/Order');
// Mock imports for related data models if they don't exist yet, or real ones if they do
// Assuming Address/BankDetails logic is stored within User or separate models. 
// User model has `savedAddresses`. 
const Review = require('../models/Review') || { find: () => ({ sort: () => [] }) }; // Fallback if Review model missing

// @desc    Get all users (with search & pagination)
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const { keyword, pageNumber, role } = req.query;
        const pageSize = 20;
        const page = Number(pageNumber) || 1;

        const query = {};

        // Search Logic
        if (keyword) {
            query.$or = [
                { username: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { mobile: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Filter by role (optional, default to customers usually preferred but list wants all?)
        // Requirement says "Customer (User) Management", implying mostly 'customer' role
        if (role) {
            query.role = role;
        }

        const count = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ users, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single user details
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get aggregate data for 360 View
// @route   GET /api/users/:id/related-data
// @access  Admin
exports.getUserRelatedData = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Parallel fetch for related data
        // Note: Models like Wishlist might need to be imported properly if they are separate collections
        // Based on previous file lists, Wishlist.js, Cart.js exist.

        // Assuming Order structure links with `user` field
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        // Placeholder for Reviews (if separate collection)
        // const reviews = await Review.find({ user: userId }); 

        res.json({
            user,
            orders,
            // wishlist: [], // Populate if needed
            // cart: {}, // Populate if needed
            // reviews: [] // Populate if needed
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create new user (Admin)
// @route   POST /api/users
// @access  Admin
exports.createUser = async (req, res) => {
    try {
        const { username, mobile, email, password, role, image } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email or mobile' });
        }

        const user = await User.create({
            username,
            email,
            mobile,
            password, // Password hashing should be in User model 'pre save'
            role: role || 'customer',
            image
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.role = req.body.role || user.role;
            if (req.body.image) user.image = req.body.image;

            // Only update password if sent
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// @desc    Delete User (Cascade Logic)
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Soft Delete
        user.isActive = false;
        await user.save();

        res.json({ message: 'User deactivated successfully (Soft Delete)' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed', error: error.message });
    }
};
