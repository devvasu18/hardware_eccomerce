const Order = require('../models/Order');
const Product = require('../models/Product');
const ProcurementRequest = require('../models/ProcurementRequest');

// @desc    Get Revenue Analytics (Daily/Weekly)
// @route   GET /api/analytics/revenue
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { range } = req.query; // '7days', '30days', '1year'

        const endDate = new Date();
        const startDate = new Date();

        let groupByFormat;
        let dateStep; // 'day' or 'month'

        if (range === '1year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
            groupByFormat = "%Y-%m"; // Group by Month for 1 year
            dateStep = 'month';
        } else if (range === '30days') {
            startDate.setDate(startDate.getDate() - 30);
            groupByFormat = "%Y-%m-%d"; // Group by Day
            dateStep = 'day';
        } else {
            startDate.setDate(startDate.getDate() - 7); // Default 7 days
            groupByFormat = "%Y-%m-%d";
            dateStep = 'day';
        }

        // 1. Database Aggregation
        const revenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['Cancelled', 'Returned'] },
                    paymentStatus: { $nin: ['Failed', 'Refunded'] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAt", timezone: "Asia/Kolkata" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Generate Complete Date Range (Fill missing dates with 0)
        const filledData = [];
        const currentDate = new Date(startDate);
        // Normalize start date to prevent time drift issues, or just rely on the step

        const dataMap = new Map();
        revenue.forEach(item => dataMap.set(item._id, item));

        // Helper to format date in IST
        const getISTDateKey = (date, format) => {
            const options = { timeZone: 'Asia/Kolkata' };
            if (format === 'month') {
                // YYYY-MM
                // We can't easily use en-CA for YYYY-MM directly roughly
                // Let's use parts
                const formatter = new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric', month: '2-digit' });
                const parts = formatter.formatToParts(date);
                const y = parts.find(p => p.type === 'year').value;
                const m = parts.find(p => p.type === 'month').value;
                return `${y}-${m}`;
            } else {
                // YYYY-MM-DD
                // en-CA is standard YYYY-MM-DD
                return new Intl.DateTimeFormat('en-CA', options).format(date);
            }
        };

        const getLabel = (date, step) => {
            const options = { timeZone: 'Asia/Kolkata' };
            if (step === 'month') {
                return new Intl.DateTimeFormat('en-US', { ...options, month: 'short', year: '2-digit' }).format(date);
            } else {
                return new Intl.DateTimeFormat('en-US', { ...options, day: 'numeric', month: 'short' }).format(date);
            }
        };

        while (currentDate <= endDate) {
            const dateKey = getISTDateKey(currentDate, dateStep);

            const existingData = dataMap.get(dateKey);

            if (existingData) {
                filledData.push({
                    _id: dateKey,
                    totalSales: existingData.totalSales,
                    count: existingData.count,
                    label: getLabel(currentDate, dateStep)
                });
            } else {
                // Determine if we should push (deduplicate if keys repeat due to time shifts? 
                // With daily step and proper timezone, keys should advance.
                // However, simple loop might hit same IST day twice if step < 24h or near boundary?
                // Standard loop adds 24h.
                // Let's check duplicates
                const lastEntry = filledData[filledData.length - 1];
                if (!lastEntry || lastEntry._id !== dateKey) {
                    filledData.push({
                        _id: dateKey,
                        totalSales: 0,
                        count: 0,
                        label: getLabel(currentDate, dateStep)
                    });
                }
            }

            // Increment Date
            if (dateStep === 'month') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        res.json(filledData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Top Selling Products
// @route   GET /api/analytics/top-products
exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.variationText" }, // Try to get name snapshot 
                    // Actual product name needs join, but snapshot might be simpler if available
                    // Let's rely on lookup for robustness
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$productDetails.title", 0] },
                    totalSold: 1
                }
            }
        ]);

        res.json(topProducts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Inventory Health
// @route   GET /api/analytics/inventory
exports.getInventoryHealth = async (req, res) => {
    try {
        const lowStockThreshold = 5; // Default

        const totalProducts = await Product.countDocuments();
        const outOfStock = await Product.countDocuments({ stock: 0 });
        const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: lowStockThreshold } });
        const healthyStock = await Product.countDocuments({ stock: { $gt: lowStockThreshold } });

        res.json({
            total: totalProducts,
            outOfStock,
            lowStock,
            healthyStock
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Recent Activity
// @route   GET /api/analytics/activity
exports.getRecentActivity = async (req, res) => {
    try {
        // Fetch last 5 orders
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id totalAmount status createdAt guestCustomer user invoiceNumber')
            .populate('user', 'username');

        // Fetch last 5 requests
        const requests = await ProcurementRequest.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id product requestedQuantity status createdAt customerContact')
            .populate('product', 'title');

        // Normalize and Merge
        const activity = [
            ...orders.map(o => ({
                id: o._id,
                type: 'ORDER',
                message: `New Order #${o.invoiceNumber || o._id.toString().slice(-6)}: ₹${o.totalAmount}`,
                status: o.status,
                date: o.createdAt,
                user: o.user ? o.user.username : (o.guestCustomer?.name || 'Guest')
            })),
            ...requests.map(r => ({
                id: r._id,
                type: 'REQUEST',
                message: `Request for ${r.product?.title || 'Unknown Product'} (Qty: ${r.requestedQuantity})`,
                status: r.status,
                date: r.createdAt,
                user: r.customerContact?.name || 'Unknown'
            }))
        ];

        // Sort combined list by date desc
        activity.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(activity.slice(0, 10));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
