const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const TaxCalculator = require('../utils/taxCalculator');
const Product = require('../models/Product');

// Create Order (With Tax Logic)
router.post('/', async (req, res) => {
    try {
        const { user, items, shippingAddress, paymentDetails } = req.body;

        // Extract State from Shipping Address (Simple parsing for MVP)
        // Check if string contains "Gujarat"
        const state = shippingAddress.toLowerCase().includes('gujarat') ? 'Gujarat' : 'Other';

        let grandTotal = 0;
        let totalTax = 0;
        const processedItems = [];

        // Calculate for each item
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Product ${item.product} not found`);

            // Use Product Defined Tax Rate or Default 18
            const taxRate = product.gstRate || 18;

            const taxDetails = TaxCalculator.calculateItemTax(
                item.priceAtBooking,
                item.quantity,
                state,
                product.hsnCode,
                taxRate
            );

            processedItems.push({
                product: item.product,
                quantity: item.quantity,
                priceAtBooking: item.priceAtBooking,
                gstRate: taxRate,
                cgst: taxDetails.cgst,
                sgst: taxDetails.sgst,
                igst: taxDetails.igst,
                totalWithTax: taxDetails.total
            });

            grandTotal += taxDetails.total;
            totalTax += taxDetails.taxAmount;
        }

        const invoiceNumber = await TaxCalculator.generateInvoiceNumber(Order);

        const newOrder = new Order({
            user,
            items: processedItems,
            totalAmount: Math.round(grandTotal), // Rounding off final
            taxTotal: totalTax,
            invoiceNumber,
            invoiceDate: new Date(),
            shippingAddress,
            status: 'Order Placed',
            paymentDetails
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Order Creation Failed', error: err.message });
    }
});

// Get Orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Single Order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update Logistics
router.patch('/:id/logistics', async (req, res) => {
    try {
        const { busNumber, driverContact } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, {
            status: 'Assigned to Bus',
            busDetails: {
                busNumber,
                driverContact,
                dispatchDate: new Date()
            },
            $push: {
                logisticsUpdates: {
                    status: 'Assigned to Bus',
                    timestamp: new Date()
                }
            }
        }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
