const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hardware_system')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Check Error:', err));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/admin/products', require('./routes/adminProductRoutes')); // Admin Product Management
app.use('/api/admin', require('./routes/adminMasterRoutes')); // HSN, Categories, Brands, Offers (mounted at /api/admin/hsn, etc)

app.use('/api/cart', require('./routes/cartRoutes')); // Cart Management

// Test endpoint to verify backend is working
app.get('/api/test', (req, res) => {
    console.log('🧪 TEST endpoint hit!');
    res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.use('/api/wishlist', require('./routes/wishlistRoutes')); // Wishlist Management
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes')); // Shipment Management
app.use('/api/status', require('./routes/statusRoutes')); // Status Tracking
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tally', require('./routes/tallyRoutes')); // The integration core
app.use('/api/banners', require('./routes/bannerRoutes')); // Dynamic Hero Slider
app.use('/api/users', require('./routes/userRoutes')); // User Management
app.use('/api/categories', require('./routes/categoryRoutes')); // Category Management
app.use('/api/special-offers', require('./routes/specialOfferRoutes')); // Special Offers
app.use('/api/homepage', require('./routes/homepageRoutes')); // Homepage Features & Trust Indicators
app.use('/api/admin/parties', require('./routes/partyRoutes')); // Party Master
app.use('/api/admin/stock', require('./routes/stockRoutes')); // Stock Entry & Ledger
app.use('/api/coupons', require('./routes/couponRoutes')); // Coupon Management
app.use('/api/transactions', require('./routes/transactionRoutes')); // Transaction Management
app.use('/api/brands', require('./routes/brandRoutes')); // Public Brand Routes
app.use('/api/refunds', require('./routes/refundRoutes')); // Refund Management

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
