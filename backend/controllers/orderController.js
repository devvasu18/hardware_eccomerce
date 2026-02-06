const Order = require('../models/Order');
const StatusLog = require('../models/StatusLog');
const Product = require('../models/Product');
const User = require('../models/User');
const tallyService = require('../services/tallyService');
const { logAction } = require('../utils/auditLogger');

// @desc    Create a new order
// @route   POST /api/orders/create
// @access  Public (supports both authenticated and guest users)
// @access  Public (supports both authenticated and guest users)
exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, billingAddress, paymentMethod, guestCustomer } = req.body;


        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in order' });
        }

        // H2: Strict Input Validation for Items (Prevent Negative Quantity Exploit)
        for (const item of items) {
            if (!item.productId) {
                return res.status(400).json({ success: false, message: 'Product ID is required for all items' });
            }
            if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                return res.status(400).json({ success: false, message: `Invalid quantity for product ${item.productId}` });
            }
        }

        if (!shippingAddress || !billingAddress) {
            return res.status(400).json({ success: false, message: 'Shipping and billing addresses are required' });
        }

        // Determine Tax Type based on Address
        let addressToCheck = '';
        if (typeof shippingAddress === 'string') {
            addressToCheck = shippingAddress;
        } else if (typeof shippingAddress === 'object') {
            addressToCheck = `${shippingAddress.street || ''} ${shippingAddress.city || ''} ${shippingAddress.state || ''}`;
        }
        const isIntraState = addressToCheck.toLowerCase().includes('gujarat'); // Shop is in Gujarat

        // Calculate order total securely
        let orderTotal = 0;
        let totalTax = 0;
        const orderItems = [];

        // Parallel processing or sequential? Sequential is safer for stock check race conditions logic conceptually, though db logic needs transactions ideally.
        // Helper to rollback stock changes if any item fails
        const rollbackStock = async (processedItems) => {
            for (const item of processedItems) {
                if (item.modelId) {
                    if (item.variationId) {
                        await Product.findOneAndUpdate(
                            { _id: item.productId, 'models._id': item.modelId },
                            { $inc: { 'models.$[m].variations.$[v].stock': item.quantity } },
                            { arrayFilters: [{ 'm._id': item.modelId }, { 'v._id': item.variationId }] }
                        );
                    } else {
                        // Restore to model base? (Usually variants carry stock in this system)
                        // If model has variations but none selected (unlikely in this logic), we might need logic here.
                    }
                } else if (item.variationId) {
                    await Product.findOneAndUpdate(
                        { _id: item.productId, 'variations._id': item.variationId },
                        { $inc: { 'variations.$.stock': item.quantity } }
                    );
                } else {
                    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
                }
            }
        };

        // Optimize: Fetch all products in one query to avoid N+1 reads
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        // Validate all products exist
        for (const id of productIds) {
            if (!productMap.has(id.toString())) {
                return res.status(404).json({ success: false, message: `Product ${id} not found` });
            }
        }

        const processedItems = [];

        for (const item of items) {
            const product = productMap.get(item.productId.toString());

            // Determine available stock for check
            let availableStock = product.stock;
            if (item.modelId && product.models) {
                const model = product.models.find(m => m._id.toString() === item.modelId);
                if (model) {
                    if (item.variationId) {
                        const variant = model.variations.find(v => v._id.toString() === item.variationId);
                        if (variant) availableStock = variant.stock;
                    } else {
                        availableStock = model.variations.reduce((acc, v) => acc + (v.stock || 0), 0);
                    }
                }
            } else if (item.variationId && product.variations) {
                const variant = product.variations.find(v => v._id.toString() === item.variationId);
                if (variant) availableStock = variant.stock;
            }

            // 2. ATOMIC DECREMENT: Check local stock first to fail fast, then db atomic
            if (!product.isOnDemand && availableStock < item.quantity) {
                await rollbackStock(processedItems);
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.title}. Available: ${availableStock}`
                });
            }

            let updatedProduct;
            // SKIP STOCK DECREMENT FOR ON-DEMAND ITEMS
            if (product.isOnDemand) {
                updatedProduct = product; // No change needed
            } else if (item.modelId) {
                if (item.variationId) {
                    updatedProduct = await Product.findOneAndUpdate(
                        { _id: item.productId },
                        { $inc: { 'models.$[m].variations.$[v].stock': -item.quantity } },
                        {
                            arrayFilters: [{ 'm._id': item.modelId }, { 'v._id': item.variationId, 'v.stock': { $gte: item.quantity } }],
                            new: true
                        }
                    );
                } else {
                    // Logic for model without specific variation? (Maybe deduct from first variant or error)
                    // In our current UI, user MUST select variation if model has them.
                }
            } else if (item.variationId) {
                updatedProduct = await Product.findOneAndUpdate(
                    { _id: item.productId, 'variations._id': item.variationId, 'variations.stock': { $gte: item.quantity } },
                    { $inc: { 'variations.$.stock': -item.quantity } },
                    { new: true }
                );
            } else {
                updatedProduct = await Product.findOneAndUpdate(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
            }

            if (!updatedProduct) {
                await rollbackStock(processedItems);
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.title}. Stock update failed.`
                });
            }

            // Track for potential rollback
            processedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                variationId: item.variationId,
                modelId: item.modelId
            });

            // 3. Use Database Price & GST
            let price;

            if (item.modelId && product.models) {
                const model = product.models.find(m => m._id.toString() === item.modelId);
                if (model) {
                    price = model.selling_price_a || model.mrp;
                    if (item.variationId) {
                        const variant = model.variations.find(v => v._id.toString() === item.variationId);
                        if (variant) price = variant.price;
                    }
                }
            } else if (item.variationId && product.variations) {
                const variant = product.variations.find(v => v._id.toString() === item.variationId);
                if (variant) price = variant.price;
            }

            if (price === undefined || price === null) {
                // Fallback to Base Product Price
                price = product.selling_price_a || product.mrp;
            }

            // Apply Wholesale Discount
            if (req.user && req.user.customerType === 'wholesale' && req.user.wholesaleDiscount > 0) {
                const discountAmount = (price * req.user.wholesaleDiscount) / 100;
                price = Math.round((price - discountAmount) * 100) / 100; // Ensure 2 decimal places max or rounding
            }
            const gstRate = product.gst_rate || 18; // Default to 18% if not set

            const itemTotal = price * item.quantity;
            const itemTax = itemTotal * (gstRate / 100);

            orderTotal += itemTotal;
            totalTax += itemTax;

            const orderItem = {
                product: item.productId,
                productTitle: product.title,
                productImage: product.featured_image,
                quantity: item.quantity,
                priceAtBooking: price,
                size: item.size || null,
                variationId: item.variationId,
                variationText: item.variationText,
                modelId: item.modelId,
                modelName: item.modelName,
                gstRate: gstRate,
                totalWithTax: itemTotal + itemTax,
                requestId: item.requestId
            };

            // Split Tax
            if (isIntraState) {
                orderItem.cgst = itemTax / 2;
                orderItem.sgst = itemTax / 2;
                orderItem.igst = 0;
            } else {
                orderItem.cgst = 0;
                orderItem.sgst = 0;
                orderItem.igst = itemTax;
            }

            orderItems.push(orderItem);
        }

        const grandTotal = Math.round(orderTotal + totalTax);

        // Generate Invoice Number
        // Format: INV-YYYYMMDD-SEQUENCE (Using timestamp for uniqueness + sequence fallback if needed, or just random/timestamp for MVP)
        // High-scale robust sequence requires a counter collection. For now, we use Timestamp + Random suffix to ensure uniqueness without race condition lock.
        // OR better: Year-Month-Random
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = String(dateNow.getMonth() + 1).padStart(2, '0');
        const day = String(dateNow.getDate()).padStart(2, '0');

        // Find last order to try for sequence (best effort)
        // const lastOrder = await Order.findOne().sort('-createdAt'); // Optimization: Skip for speed, use entropy

        const entropy = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        const invoiceNumber = `INV-${year}${month}${day}-${entropy}`;


        // Create order object
        const orderData = {
            invoiceNumber,
            invoiceDate: dateNow,
            items: orderItems,
            shippingAddress,
            billingAddress,
            paymentMethod: paymentMethod || 'Online',
            paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Pending',
            status: 'Order Placed',  // Changed from 'Pending' to 'Order Placed' to match enum
            totalAmount: grandTotal,  // Changed from 'total' to 'totalAmount'
            taxTotal: Math.round(totalTax),      // Changed from 'tax' to 'taxTotal'
            isGuestOrder: false       // Will be set to true for guest orders
        };

        // Handle authenticated vs guest user
        if (req.user) {
            // Authenticated user
            orderData.user = req.user._id;
            orderData.isGuestOrder = false;
        } else if (guestCustomer) {
            // Guest user
            orderData.guestCustomer = {
                name: guestCustomer.name,
                phone: guestCustomer.phone,
                email: guestCustomer.email || '',
                address: guestCustomer.address || shippingAddress
            };
            orderData.isGuestOrder = true;
        } else {
            return res.status(400).json({ success: false, message: 'User authentication or guest details required' });
        }

        // Create the order
        try {
            // Create the order
            const order = await Order.create(orderData);

            // Create initial status log
            const statusLogData = {
                order: order._id,
                status: 'Order Placed',
                updatedByName: 'System',
                updatedByRole: 'system',
                notes: 'Order created successfully',
                isSystemGenerated: true
            };

            if (req.user) {
                statusLogData.updatedBy = req.user._id;
                // AUTOMATICALLY CLEAR CART (Only for COD, Online is cleared in verification)
                if (paymentMethod === 'COD') {
                    const Cart = require('../models/Cart');
                    await Cart.findOneAndDelete({ user: req.user._id });
                }
            }

            await StatusLog.create(statusLogData);

            // --- Update Request Status logic ---
            // If this order contains items from approved requests, mark them as converted
            for (const item of orderItems) {
                if (item.requestId) {
                    try {
                        const ProcurementRequest = require('../models/ProcurementRequest');
                        await ProcurementRequest.findByIdAndUpdate(item.requestId, { status: 'Converted to Order' });
                    } catch (reqErr) {
                        console.error('Failed to update ProcurementRequest status:', reqErr);
                        // Do not fail order creation for this
                    }
                }
            }

            // --- Send Email Notifications (Async, don't fail order if email fails) ---
            try {
                // 1. To Customer
                const customerEmail = req.user ? req.user.email : (guestCustomer ? guestCustomer.email : null);
                if (customerEmail) {
                    const sendEmail = require('../utils/sendEmail');
                    await sendEmail({
                        email: customerEmail,
                        subject: `Order Confirmation - #${order.orderNumber || order._id}`,
                        message: `Thank you for your order! Your order #${order.orderNumber || order._id} has been placed successfully. Total: ₹${grandTotal}. We will notify you when it ships.`,
                        html: `<h1>Order Confirmation</h1><p>Thank you for shopping with us.</p><p>Order ID: <strong>${order.orderNumber || order._id}</strong></p><p>Total Amount: <strong>₹${grandTotal}</strong></p>`
                    });
                }
                // 2. To Admin
                const sendEmail = require('../utils/sendEmail');
                await sendEmail({
                    email: process.env.ADMIN_EMAIL || 'admin@hardwarestore.com',
                    subject: `New Order Received - #${order.orderNumber || order._id}`,
                    message: `New order received from ${req.user ? req.user.username : (guestCustomer ? guestCustomer.name : 'Guest')}. Total: ₹${grandTotal}.`,
                });
            } catch (emailErr) {
                console.error('Email sending failed:', emailErr.message);
                // Proceed, order is created
            }

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderId: order._id,
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    total: order.totalAmount,
                    status: order.status
                }
            });

        } catch (createErr) {
            console.error('Order creation failed, rolling back stock:', createErr.message);
            await rollbackStock(processedItems);
            return res.status(500).json({ success: false, message: 'Failed to create order', error: createErr.message });
        }

    } catch (error) {
        console.error('Create order error (Outer):', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product', 'title featured_image'); // Populate product name & image for display

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
};

// @desc    Get all orders with optional filtering
// @route   GET /api/orders
// @access  Admin
exports.getOrders = async (req, res) => {
    try {
        const { keyword, status, paymentStatus, pageNumber } = req.query;
        const pageSize = 20;
        const page = Number(pageNumber) || 1;

        const query = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (keyword) {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(keyword);
            if (isObjectId) {
                query._id = keyword;
            }
        }

        const count = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'username email mobile')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ orders, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private (Admin or Owner)
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email mobile image')
            .populate('items.product', 'title featured_image');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Check if user is admin or the order owner
        const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'admin'];
        const isOwner = order.user && order.user._id.toString() === req.user._id.toString();

        if (!adminRoles.includes(req.user.role) && !isOwner) {
            return res.status(401).json({ message: 'Not authorized to view this order' });
        }

        // Fetch Status Timeline
        const timeline = await StatusLog.find({ order: req.params.id }).sort({ timestamp: -1 });

        // Response format needed by frontend: { success: true, order, timeline } (based on ViewDetails page)
        // Previous response was just { order, timeline } but frontend checks `if (orderData.success)`
        // Wait, looking at Step 36 line 74: `if (orderData.success)`. 
        // The previous controller code (Step 20 line 314) was `res.json({ order, timeline });` which would implicitly have no success field (undefined).
        // This suggests the frontend (Step 36) expects `success: true`. 
        // I will align the response to match the frontend expectation.

        res.json({ success: true, order, timeline });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, description, notifyUser, busDetails } = req.body;

        // Parse busDetails if it's a string (common with multipart/form-data)
        let parsedBusDetails = busDetails;
        if (typeof busDetails === 'string') {
            try {
                parsedBusDetails = JSON.parse(busDetails);
            } catch (e) {
                console.error('Failed to parse busDetails:', e);
            }
        }
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const oldStatus = order.status;

        // Strict Workflow Validation: Prevent skipping steps
        if (status === 'Delivered' && oldStatus !== 'Assigned to Bus') {
            return res.status(400).json({ message: 'Order must be Assigned to Bus (Logistics) before it can be marked Delivered.' });
        }
        if (status === 'Assigned to Bus' && oldStatus !== 'Packed' && oldStatus !== 'Assigned to Bus') {
            return res.status(400).json({ message: 'Order must be Packed before Logistics Assignment.' });
        }

        order.status = status;

        // Handling Logic for "Assigned to Bus"
        if (status === 'Assigned to Bus' && parsedBusDetails) {

            // Fix: Construct proper Date object for departureTime if it's just a time string
            let finalDepartureTime = parsedBusDetails.departureTime;
            if (parsedBusDetails.dispatchDate && parsedBusDetails.departureTime && typeof parsedBusDetails.departureTime === 'string' && !parsedBusDetails.departureTime.includes('T')) {
                finalDepartureTime = new Date(`${parsedBusDetails.dispatchDate}T${parsedBusDetails.departureTime}`);
            }

            order.busDetails = {
                busNumber: parsedBusDetails.busNumber,
                driverContact: parsedBusDetails.driverContact,
                departureTime: finalDepartureTime,
                expectedArrival: parsedBusDetails.expectedArrival,
                dispatchDate: parsedBusDetails.dispatchDate,
                // Handle image if uploaded? Usually file upload middleware handles it
                // If busPhoto comes as string (url), save it.
                busPhoto: parsedBusDetails.busPhoto || order.busDetails?.busPhoto
            };
        }

        // Handle Image Upload logic if using middleware
        if (req.file) {
            // If the route used upload middleware and a file was sent
            if (status === 'Assigned to Bus') {
                if (!order.busDetails) order.busDetails = {};
                order.busDetails.busPhoto = req.file.path.replace(/\\/g, '/');
            }
        }

        await order.save();

        // Create Status Log
        await StatusLog.create({
            order: order._id,
            status: status,
            updatedBy: req.user._id,
            updatedByName: req.user.username,
            updatedByRole: req.user.role,
            notes: description || `Status changed from ${oldStatus} to ${status}`
        });

        // Global Audit Log
        await logAction({
            action: 'UPDATE_ORDER_STATUS',
            req,
            targetResource: 'Order',
            targetId: order._id,
            details: { from: oldStatus, to: status, notes: description }
        });

        // 📧 SEND EMAIL NOTIFICATION
        if (notifyUser !== false) { // Allow frontend to optionally suppress
            try {
                // Determine Recipient
                let recipientEmail = null;
                let recipientName = 'Customer';

                if (order.user) {
                    // We need to fetch user details if not populated
                    // Optimisation: check if order.user has email property (is object) or is ID
                    if (order.user.email) {
                        recipientEmail = order.user.email;
                        recipientName = order.user.username;
                    } else {
                        const User = require('../models/User'); // Lazy load
                        const fullUser = await User.findById(order.user);
                        if (fullUser) {
                            recipientEmail = fullUser.email;
                            recipientName = fullUser.username;
                        }
                    }
                } else if (order.guestCustomer && order.guestCustomer.email) {
                    recipientEmail = order.guestCustomer.email;
                    recipientName = order.guestCustomer.name;
                }

                if (recipientEmail) {
                    const sendEmail = require('../utils/sendEmail');
                    const emailSubject = `Order Status Update - #${order.orderNumber || order._id} is ${status}`;
                    const emailMessage = `Hello ${recipientName},\n\nYour order status has been updated to: ${status}.\n\n${description ? `Note: ${description}\n\n` : ''}Track your order on our website.\n\nThank you!`;

                    await sendEmail({
                        email: recipientEmail,
                        subject: emailSubject,
                        message: emailMessage
                    });
                }
            } catch (emailErr) {
                console.error('Failed to send status update email:', emailErr.message);
                // Don't fail the request just because email failed
            }
        }

        // Tally Sync Trigger
        if (status === 'Assigned to Bus') {
            // We don't await this to keep the API response fast. 
            // Tally sync happens in background/async.
            tallyService.syncOrderToTally(order._id)
                .then(result => console.log(`Auto-Sync Tally [${order._id}]:`, result.success ? 'Success' : result.error))
                .catch(err => console.error('Auto-Sync Tally Failed:', err));
        }

        res.json({ message: 'Status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// @desc    Cancel Order
// @route   POST /api/orders/:id/cancel
// @access  Admin
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        order.status = 'Cancelled';
        await order.save();

        // Restore Stock Logic
        for (const item of order.items) {
            if (item.modelId) {
                if (item.variationId) {
                    await Product.findOneAndUpdate(
                        { _id: item.product, 'models._id': item.modelId },
                        { $inc: { 'models.$[m].variations.$[v].stock': item.quantity } },
                        { arrayFilters: [{ 'm._id': item.modelId }, { 'v._id': item.variationId }] }
                    );
                } else {
                    // Restore to model base?
                }
            } else if (item.variationId) {
                await Product.findOneAndUpdate(
                    { _id: item.product, 'variations._id': item.variationId },
                    { $inc: { 'variations.$.stock': item.quantity } }
                );
            } else {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        await StatusLog.create({
            order: order._id,
            status: 'Cancelled',
            updatedBy: req.user._id,
            updatedByName: req.user.username,
            updatedByRole: req.user.role,
            notes: req.body.reason || 'Order cancelled by admin'
        });

        // Tally Sync: Push Cancellation
        if (order.tallyStatus === 'saved') {
            tallyService.syncOrderToTally(order._id)
                .then(result => console.log(`Auto-Sync Cancel Tally [${order._id}]:`, result.success ? 'Success' : result.error))
                .catch(err => console.error('Auto-Sync Cancel Tally Failed:', err));
        }

        await logAction({ action: 'CANCEL_ORDER', req, targetResource: 'Order', targetId: order._id, details: { reason: req.body.reason } });

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Cancellation failed', error: error.message });
    }
};
