const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hardware_system')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Check Error:', err));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tally', require('./routes/tallyRoutes')); // The integration core
app.use('/api/banners', require('./routes/bannerRoutes')); // Dynamic Hero Slider
app.use('/api/users', require('./routes/userRoutes')); // User Management
app.use('/api/categories', require('./routes/categoryRoutes')); // Category Management
app.use('/api/special-offers', require('./routes/specialOfferRoutes')); // Special Offers
app.use('/api/homepage', require('./routes/homepageRoutes')); // Homepage Features & Trust Indicators

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
