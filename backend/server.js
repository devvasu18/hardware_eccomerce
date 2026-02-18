const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize'); // Replaced
// const xss = require('xss-clean'); // Replaced
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving images from /uploads
}));
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10MB' })); // Body limit

const { mongoSanitize, xssSanitize } = require('./middleware/security');

// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize);

// Data Sanitization against XSS
app.use(xssSanitize);

// Prevent Parameter Pollution
app.use(hpp());

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', globalLimiter);

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const logger = require('./utils/logger');
const notificationService = require('./services/notificationService');
const { startTallyHealthCheckJob } = require('./jobs/tallyHealthCheckJob');
const { cleanupStuckMessages, cleanupStuckEmails, getQueueHealth, getEmailQueueHealth } = require('./utils/queueCleanup');

// Database Connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hardware_system')
    .then(async () => {
        logger.info('MongoDB Connected');

        // Cleanup stuck messages/emails from previous server crash
        try {
            await cleanupStuckMessages();
            await cleanupStuckEmails();

            const waHealth = await getQueueHealth();
            const emailHealth = await getEmailQueueHealth();

            if (waHealth) logger.info('[WhatsApp Queue Health]', waHealth);
            if (emailHealth) logger.info('[Email Queue Health]', emailHealth);

        } catch (error) {
            logger.error('[Startup] Queue cleanup failed:', error);
        }
    })
    .catch(err => logger.error('MongoDB Connection Check Error:', err));

// Routes
app.use('/api/public', require('./routes/publicRoutes')); // Publicly available data
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/admin/products', require('./routes/adminProductRoutes')); // Admin Product Management
app.use('/api/admin', require('./routes/adminMasterRoutes')); // HSN, Categories, Brands, Offers (mounted at /api/admin/hsn, etc)

app.use('/api/cart', require('./routes/cartRoutes')); // Cart Management

// Uptime Robot / Health Check Endpoints
app.get('/', (req, res) => {
    res.status(200).send('Create Hardware Server is Running');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Test endpoint to verify backend is working
app.get('/api/test', (req, res) => {
    logger.info('🧪 TEST endpoint hit!');
    res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.use('/api/wishlist', require('./routes/wishlistRoutes')); // Wishlist Management
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes')); // Shipment Management
app.use('/api/status', require('./routes/statusRoutes')); // Status Tracking
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tally/admin', require('./routes/tallyAdminRoutes')); // Tally Admin & Queue
app.use('/api/tally', require('./routes/tallyRoutes')); // The integration core
app.use('/api/banners', require('./routes/bannerRoutes')); // Dynamic Hero Slider
app.use('/api/offers', require('./routes/offerRoutes')); // Public Offers (for product filtering)
app.use('/api/users', require('./routes/userRoutes')); // User Management
app.use('/api/categories', require('./routes/categoryRoutes')); // Category Management
app.use('/api/special-offers', require('./routes/specialOfferRoutes')); // Special Offers
app.use('/api/homepage', require('./routes/homepageRoutes')); // Homepage Features & Trust Indicators
app.use('/api/home-layout', require('./routes/homeLayoutRoutes')); // Headless CMS Home Layout
app.use('/api/admin/home-layout', require('./routes/adminHomeLayoutRoutes')); // Admin Page Builder API
app.use('/api/admin/parties', require('./routes/partyRoutes')); // Party Master
app.use('/api/admin/stock', require('./routes/stockRoutes')); // Stock Entry & Ledger
app.use('/api/coupons', require('./routes/couponRoutes')); // Coupon Management
app.use('/api/transactions', require('./routes/transactionRoutes')); // Transaction Management
app.use('/api/brands', require('./routes/brandRoutes')); // Public Brand Routes
app.use('/api/refunds', require('./routes/refundRoutes')); // Refund Management
app.use('/api/payment', require('./routes/paymentRoutes')); // Payment Gateway
app.use('/api/admin/analytics', require('./routes/analyticsRoutes')); // Admin Analytics Dashboard

// Status Tracking
const runStockCleanup = require('./jobs/stockCleanup');
const { initTallyPullJobs } = require('./jobs/tallyPullJob');

// Initialize Cron Jobs
runStockCleanup();
startTallyHealthCheckJob();
initTallyPullJobs();

// Start Workers
const whatsappWorker = require('./whatsappWorker');
whatsappWorker.start().catch(err => logger.error('WhatsApp Worker Error:', err));

const emailWorker = require('./emailWorker');
emailWorker.start().catch(err => logger.error('Email Worker Error:', err));

app.use('/api/whatsapp', require('./routes/whatsappRoutes')); // WhatsApp Automation Routes
app.use('/api/email', require('./routes/emailRoutes')); // Email Monitoring Routes
app.use('/api/admin/settings', require('./routes/settingsRoutes')); // System Settings
app.use('/api/notifications', require('./routes/notificationRoutes')); // Notification System

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Initialize Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            const allowedOrigins = [
                process.env.FRONTEND_URL,
                'http://localhost:3000',
                'http://127.0.0.1:3000'
            ].filter(Boolean);

            if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

notificationService.init(io);
server.setTimeout(10 * 60 * 1000); // 10 minutes timeout
server.keepAliveTimeout = 120 * 1000; // 2 minutes
server.headersTimeout = 120 * 1000; // 2 minutes
