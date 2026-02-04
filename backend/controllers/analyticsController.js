const Order = require('../models/Order');
const Product = require('../models/Product');
const ProcurementRequest = require('../models/ProcurementRequest');

// @desc    Get Revenue Analytics (Daily/Weekly)
// @route   GET /api/analytics/revenue
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { range } = req.query; // '7days', '30days', '1year'

        let startDate = new Date();
        if (range === '30days') startDate.setDate(startDate.getDate() - 30);
        else if (range === '1year') startDate.setFullYear(startDate.getFullYear() - 1);
        else startDate.setDate(startDate.getDate() - 7); // Default 7 days

        const revenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    // Include 'Paid' and 'COD' (Assuming COD is valid sale) 
                    // Exclude 'Failed', 'Refunded', 'Cancelled'
                    status: { $nin: ['Cancelled', 'Returned'] },
                    paymentStatus: { $nin: ['Failed', 'Refunded'] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(revenue);
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
