const Order = require('../models/Order');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ProcurementRequest = require('../models/ProcurementRequest');
const Refund = require('../models/Refund');
const Brand = require('../models/Brand');
const HSNCode = require('../models/HSNCode');
const Offer = require('../models/Offer');
const ExportHelper = require('../utils/exportHelper');

/**
 * Export Orders
 */
exports.exportOrders = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { status, paymentStatus } = req.query;

        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const orders = await Order.find(query)
            .populate('user', 'username email mobile')
            .sort({ createdAt: -1 })
            .lean();

        const data = orders.map(order => ({
            OrderID: order._id.toString(),
            InvoiceNumber: order.invoiceNumber || 'N/A',
            Customer: order.user?.username || order.guestCustomer?.name || 'Guest',
            Email: order.user?.email || order.guestCustomer?.email || 'N/A',
            Phone: order.user?.mobile || order.guestCustomer?.phone || 'N/A',
            TotalAmount: `₹${order.totalAmount}`,
            PaymentMethod: order.paymentMethod,
            PaymentStatus: order.paymentStatus,
            Status: order.status,
            OrderDate: new Date(order.createdAt).toLocaleString('en-IN'),
            ShippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress)
        }));

        const config = {
            filename: `orders_${new Date().toISOString().split('T')[0]}`,
            title: 'Orders Export',
            fields: ['OrderID', 'InvoiceNumber', 'Customer', 'Email', 'Phone', 'TotalAmount', 'PaymentMethod', 'PaymentStatus', 'Status', 'OrderDate', 'ShippingAddress'],
            columns: [
                { header: 'Order ID', key: 'OrderID', width: 25 },
                { header: 'Invoice Number', key: 'InvoiceNumber', width: 20 },
                { header: 'Customer', key: 'Customer', width: 25 },
                { header: 'Email', key: 'Email', width: 30 },
                { header: 'Phone', key: 'Phone', width: 15 },
                { header: 'Total Amount', key: 'TotalAmount', width: 15 },
                { header: 'Payment Method', key: 'PaymentMethod', width: 15 },
                { header: 'Payment Status', key: 'PaymentStatus', width: 15 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Order Date', key: 'OrderDate', width: 20 },
                { header: 'Shipping Address', key: 'ShippingAddress', width: 40 }
            ],
            headers: ['Order ID', 'Invoice Number', 'Customer', 'Email', 'Phone', 'Total Amount', 'Payment Method', 'Payment Status', 'Status', 'Order Date', 'Shipping Address'],
            keys: ['OrderID', 'InvoiceNumber', 'Customer', 'Email', 'Phone', 'TotalAmount', 'PaymentMethod', 'PaymentStatus', 'Status', 'OrderDate', 'ShippingAddress'],
            sheetName: 'Orders'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Users
 */
exports.exportUsers = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const users = await User.find().sort({ createdAt: -1 }).lean();

        const data = users.map(user => ({
            ID: user._id.toString(),
            Username: user.username,
            Email: user.email,
            Mobile: user.mobile || 'N/A',
            Role: user.role,
            CustomerType: user.customerType || 'retail',
            WholesaleDiscount: user.wholesaleDiscount ? `${user.wholesaleDiscount}%` : '0%',
            JoinedDate: new Date(user.createdAt).toLocaleDateString('en-IN'),
            Status: user.isActive !== false ? 'Active' : 'Inactive'
        }));

        const config = {
            filename: `users_${new Date().toISOString().split('T')[0]}`,
            title: 'Users Export',
            fields: ['ID', 'Username', 'Email', 'Mobile', 'Role', 'CustomerType', 'WholesaleDiscount', 'JoinedDate', 'Status'],
            columns: [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Username', key: 'Username', width: 25 },
                { header: 'Email', key: 'Email', width: 30 },
                { header: 'Mobile', key: 'Mobile', width: 15 },
                { header: 'Role', key: 'Role', width: 15 },
                { header: 'Customer Type', key: 'CustomerType', width: 15 },
                { header: 'Wholesale Discount', key: 'WholesaleDiscount', width: 18 },
                { header: 'Joined Date', key: 'JoinedDate', width: 15 },
                { header: 'Status', key: 'Status', width: 12 }
            ],
            headers: ['ID', 'Username', 'Email', 'Mobile', 'Role', 'Customer Type', 'Wholesale Discount', 'Joined Date', 'Status'],
            keys: ['ID', 'Username', 'Email', 'Mobile', 'Role', 'CustomerType', 'WholesaleDiscount', 'JoinedDate', 'Status'],
            sheetName: 'Users'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Transactions
 */
exports.exportTransactions = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { status, method } = req.query;

        const query = {};
        if (status) query.status = status;
        if (method) query.method = method;

        const transactions = await Transaction.find(query)
            .populate('user', 'username email')
            .populate('order', 'invoiceNumber')
            .sort({ createdAt: -1 })
            .lean();

        const data = transactions.map(tx => ({
            PaymentID: tx.paymentId || tx._id.toString(),
            OrderID: tx.order?.invoiceNumber || 'N/A',
            User: tx.user?.username || 'Guest',
            Email: tx.user?.email || 'N/A',
            Amount: `₹${tx.amount}`,
            Method: tx.method,
            Status: tx.status,
            Date: new Date(tx.createdAt).toLocaleString('en-IN'),
            Gateway: tx.gateway || 'N/A'
        }));

        const config = {
            filename: `transactions_${new Date().toISOString().split('T')[0]}`,
            title: 'Transactions Export',
            fields: ['PaymentID', 'OrderID', 'User', 'Email', 'Amount', 'Method', 'Status', 'Date', 'Gateway'],
            columns: [
                { header: 'Payment ID', key: 'PaymentID', width: 30 },
                { header: 'Order ID', key: 'OrderID', width: 20 },
                { header: 'User', key: 'User', width: 25 },
                { header: 'Email', key: 'Email', width: 30 },
                { header: 'Amount', key: 'Amount', width: 15 },
                { header: 'Method', key: 'Method', width: 15 },
                { header: 'Status', key: 'Status', width: 12 },
                { header: 'Date', key: 'Date', width: 20 },
                { header: 'Gateway', key: 'Gateway', width: 15 }
            ],
            headers: ['Payment ID', 'Order ID', 'User', 'Email', 'Amount', 'Method', 'Status', 'Date', 'Gateway'],
            keys: ['PaymentID', 'OrderID', 'User', 'Email', 'Amount', 'Method', 'Status', 'Date', 'Gateway'],
            sheetName: 'Transactions'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Procurement Requests
 */
exports.exportRequests = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { status } = req.query;

        const query = {};
        if (status) query.status = status;

        const requests = await ProcurementRequest.find(query)
            .populate('user', 'username email mobile')
            .populate('product', 'title')
            .sort({ createdAt: -1 })
            .lean();

        const data = requests.map(req => ({
            RequestID: req._id.toString(),
            Customer: req.user?.username || req.customerContact?.name || 'Guest',
            Email: req.user?.email || 'N/A',
            Phone: req.user?.mobile || req.customerContact?.mobile || 'N/A',
            ProductName: req.product?.title || 'N/A',
            Quantity: req.requestedQuantity || req.quantity || 0,
            Status: req.status,
            QuotedPrice: req.adminResponse?.priceQuote ? `₹${req.adminResponse.priceQuote}` : 'N/A',
            RequestDate: new Date(req.createdAt).toLocaleDateString('en-IN')
        }));

        const config = {
            filename: `procurement_requests_${new Date().toISOString().split('T')[0]}`,
            title: 'Procurement Requests Export',
            fields: ['RequestID', 'Customer', 'Email', 'Phone', 'ProductName', 'Quantity', 'Status', 'QuotedPrice', 'RequestDate'],
            columns: [
                { header: 'Request ID', key: 'RequestID', width: 25 },
                { header: 'Customer', key: 'Customer', width: 25 },
                { header: 'Email', key: 'Email', width: 30 },
                { header: 'Phone', key: 'Phone', width: 15 },
                { header: 'Product Name', key: 'ProductName', width: 35 },
                { header: 'Quantity', key: 'Quantity', width: 12 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Quoted Price', key: 'QuotedPrice', width: 15 },
                { header: 'Request Date', key: 'RequestDate', width: 15 }
            ],
            headers: ['Request ID', 'Customer', 'Email', 'Phone', 'Product Name', 'Quantity', 'Status', 'Quoted Price', 'Request Date'],
            keys: ['RequestID', 'Customer', 'Email', 'Phone', 'ProductName', 'Quantity', 'Status', 'QuotedPrice', 'RequestDate'],
            sheetName: 'Requests'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Refund Requests
 */
exports.exportRefunds = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { status } = req.query;

        const query = {};
        if (status) query.status = status;

        const refunds = await Refund.find(query)
            .populate('user', 'username email')
            .populate('order', 'invoiceNumber')
            .sort({ createdAt: -1 })
            .lean();

        const data = refunds.map(refund => ({
            RefundID: refund._id.toString(),
            OrderID: refund.order?.invoiceNumber || refund.order?._id || 'N/A',
            Customer: refund.user?.username || 'N/A',
            Email: refund.user?.email || 'N/A',
            Type: refund.type || 'Refund',
            Reason: refund.reason || 'N/A',
            Amount: `₹${refund.refundAmount || refund.amount || 0}`,
            Status: refund.status,
            RequestDate: new Date(refund.createdAt).toLocaleDateString('en-IN')
        }));

        const config = {
            filename: `refund_requests_${new Date().toISOString().split('T')[0]}`,
            title: 'Refund Requests Export',
            fields: ['RefundID', 'OrderID', 'Customer', 'Email', 'Type', 'Reason', 'Amount', 'Status', 'RequestDate'],
            columns: [
                { header: 'Refund ID', key: 'RefundID', width: 25 },
                { header: 'Order ID', key: 'OrderID', width: 20 },
                { header: 'Customer', key: 'Customer', width: 25 },
                { header: 'Email', key: 'Email', width: 30 },
                { header: 'Type', key: 'Type', width: 15 },
                { header: 'Reason', key: 'Reason', width: 35 },
                { header: 'Amount', key: 'Amount', width: 15 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Request Date', key: 'RequestDate', width: 15 }
            ],
            headers: ['Refund ID', 'Order ID', 'Customer', 'Email', 'Type', 'Reason', 'Amount', 'Status', 'Request Date'],
            keys: ['RefundID', 'OrderID', 'Customer', 'Email', 'Type', 'Reason', 'Amount', 'Status', 'RequestDate'],
            sheetName: 'Refunds'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Brands
 */
exports.exportBrands = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const brands = await Brand.find().populate('categories', 'name').sort({ name: 1 }).lean();

        const data = brands.map(brand => ({
            ID: brand._id.toString(),
            Name: brand.name,
            Slug: brand.slug,
            Categories: brand.categories?.map(c => c.name).join(', ') || 'N/A'
        }));

        const config = {
            filename: `brands_${new Date().toISOString().split('T')[0]}`,
            title: 'Brands Export',
            fields: ['ID', 'Name', 'Slug', 'Categories'],
            columns: [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Name', key: 'Name', width: 25 },
                { header: 'Slug', key: 'Slug', width: 25 },
                { header: 'Categories', key: 'Categories', width: 40 }
            ],
            headers: ['ID', 'Name', 'Slug', 'Categories'],
            keys: ['ID', 'Name', 'Slug', 'Categories'],
            sheetName: 'Brands'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export HSN Codes
 */
exports.exportHSNCodes = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const hsnCodes = await HSNCode.find().sort({ code: 1 }).lean();

        const data = hsnCodes.map(hsn => ({
            ID: hsn._id.toString(),
            Code: hsn.code,
            Description: hsn.description || 'N/A',
            GSTRate: `${hsn.gstRate || 0}%`
        }));

        const config = {
            filename: `hsn_codes_${new Date().toISOString().split('T')[0]}`,
            title: 'HSN Codes Export',
            fields: ['ID', 'Code', 'Description', 'GSTRate'],
            columns: [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'HSN Code', key: 'Code', width: 15 },
                { header: 'Description', key: 'Description', width: 40 },
                { header: 'GST Rate', key: 'GSTRate', width: 12 }
            ],
            headers: ['ID', 'HSN Code', 'Description', 'GST Rate'],
            keys: ['ID', 'Code', 'Description', 'GSTRate'],
            sheetName: 'HSN Codes'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Offers
 */
exports.exportOffers = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const offers = await Offer.find().sort({ createdAt: -1 }).lean();

        const data = offers.map(offer => ({
            ID: offer._id.toString(),
            Title: offer.title,
            Slug: offer.slug,
            Percentage: `${offer.percentage}%`,
            Status: offer.isActive !== false ? 'Active' : 'Inactive'
        }));

        const config = {
            filename: `offers_${new Date().toISOString().split('T')[0]}`,
            title: 'Offers Export',
            fields: ['ID', 'Title', 'Slug', 'Percentage', 'Status'],
            columns: [
                { header: 'ID', key: 'ID', width: 25 },
                { header: 'Title', key: 'Title', width: 30 },
                { header: 'Slug', key: 'Slug', width: 25 },
                { header: 'Percentage', key: 'Percentage', width: 15 },
                { header: 'Status', key: 'Status', width: 12 }
            ],
            headers: ['ID', 'Title', 'Slug', 'Percentage', 'Status'],
            keys: ['ID', 'Title', 'Slug', 'Percentage', 'Status'],
            sheetName: 'Offers'
        };

        await ExportHelper.export(format, data, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
