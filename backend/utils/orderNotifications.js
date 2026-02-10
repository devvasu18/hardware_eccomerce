const { sendNotification } = require('./notificationService');

/**
 * 1. ORDER CONFIRMATION – PAID PRODUCTS ONLY
 */
async function sendOrderConfirmation(order, customer) {
    const paidItems = order.items.map(item => ({
        product_name: item.productTitle,
        model_name: item.modelName || 'N/A',
        variant_name: item.variationText || 'Standard',
        quantity: item.quantity,
        price: item.priceAtBooking.toFixed(2)
    }));

    const emailTemplate = `Hi {{customer_name}},

Thank you for shopping with {{company_name}} 🎉

Your order has been successfully placed and confirmed.
Our team is preparing your items for dispatch.

🧾 Order ID: {{order_id}}
📅 Order Date: {{order_date}}

📦 Ordered Items:
{{#each paid_items}}
- {{product_name}}
  Model: {{model_name}}
  Variant: {{variant_name}}
  Quantity: {{quantity}}
  Price: ₹{{price}}
{{/each}}

🚚 We will deliver your order very soon.

If you need any assistance, feel free to contact us:
📞 {{support_contact_number}}
📧 {{support_email}}

Warm regards,  
{{company_name}}`;

    const whatsappTemplate = `Hello {{customer_name}} 👋

Your order has been successfully placed with *{{company_name}}* ✅

🧾 Order ID: {{order_id}}

📦 Items Ordered:
{{#each paid_items}}
• {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

🚚 We will deliver your order soon.

For any help, contact us:
📞 {{support_contact_number}}

Thank you for choosing {{company_name}} 🙏`;

    return await sendNotification({
        email: customer.email,
        mobile: customer.mobile,
        subject: 'Order Confirmed | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            customer_name: customer.name,
            order_id: order.invoiceNumber || order._id.toString(),
            order_date: order.createdAt.toLocaleDateString('en-IN'),
            paid_items: paidItems
        }
    });
}

/**
 * 2. ON-DEMAND ITEM REQUEST RECEIVED
 */
async function sendOnDemandRequestConfirmation(request, customer) {
    const onDemandItems = request.items.map(item => ({
        product_name: item.productTitle,
        model_name: item.modelName || 'N/A',
        variant_name: item.variationText || 'Standard'
    }));

    const emailTemplate = `Hi {{customer_name}},

We've received your on-demand product request at {{company_name}}.

🧾 Request ID: {{request_id}}

📦 Requested Items:
{{#each on_demand_items}}
- {{product_name}}
  Model: {{model_name}}
  Variant: {{variant_name}}
{{/each}}

⏳ Our team will review your request and contact you within *48 hours*.

For any urgent queries:
📞 {{support_contact_number}}

Regards,  
{{company_name}}`;

    const whatsappTemplate = `Hello {{customer_name}},

Your on-demand product request has been received by *{{company_name}}* 📩

📦 Requested Items:
{{#each on_demand_items}}
• {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

⏳ Our team will connect with you within *48 hours*.

For assistance:
📞 {{support_contact_number}}

Thank you 🙏`;

    return await sendNotification({
        email: customer.email,
        mobile: customer.mobile,
        subject: 'On-Demand Request Received | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            customer_name: customer.name,
            request_id: request._id.toString(),
            on_demand_items: onDemandItems
        }
    });
}

/**
 * 3. MIXED ORDER (Paid + On-Demand)
 */
async function sendMixedOrderConfirmation(order, customer, paidItems, onDemandItems) {
    const paidItemsList = paidItems.map(item => ({
        product_name: item.productTitle,
        model_name: item.modelName || 'N/A',
        variant_name: item.variationText || 'Standard'
    }));

    const onDemandItemsList = onDemandItems.map(item => ({
        product_name: item.productTitle,
        model_name: item.modelName || 'N/A',
        variant_name: item.variationText || 'Standard'
    }));

    const emailTemplate = `Hi {{customer_name}},

Thank you for placing your order with {{company_name}}.

🧾 Order ID: {{order_id}}

✅ Confirmed & Paid Items:
{{#each paid_items}}
- {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

🕒 On-Demand Requested Items:
{{#each on_demand_items}}
- {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

🚚 Paid items will be delivered soon.
⏳ For on-demand items, our team will contact you within *48 hours*.

For more details:
📞 {{support_contact_number}}

Thanks,  
{{company_name}}`;

    const whatsappTemplate = `Hello {{customer_name}},

Your order with *{{company_name}}* is partially confirmed ✅

📦 Paid items will be delivered soon.

🕒 On-Demand Items:
{{#each on_demand_items}}
• {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

⏳ For on-demand items, our team will contact you within *48 hours*.

📞 Support: {{support_contact_number}}

Thank you 🙏`;

    return await sendNotification({
        email: customer.email,
        mobile: customer.mobile,
        subject: 'Order Confirmed & On-Demand Request Received | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            customer_name: customer.name,
            order_id: order.invoiceNumber || order._id.toString(),
            paid_items: paidItemsList,
            on_demand_items: onDemandItemsList
        }
    });
}

/**
 * 4. ORDER STATUS: ASSIGNED TO BUS (DISPATCHED)
 */
async function sendShipmentDispatchNotification(order, customer) {
    const shippedItems = order.items.map(item => ({
        product_name: item.productTitle,
        model_name: item.modelName || 'N/A',
        variant_name: item.variationText || 'Standard'
    }));

    // Generate time-bound shipment tracking link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shipmentToken = Buffer.from(`${order._id}:${Date.now()}`).toString('base64');
    const shipmentTrackingLink = `${frontendUrl}/shipment/${shipmentToken}`;

    const emailTemplate = `Hi {{customer_name}},

Good news! Your order from {{company_name}} has been dispatched 🚚

🧾 Order ID: {{order_id}}

🚍 Shipment Details:
- Bus Number: {{bus_number}}
- Driver Contact: {{driver_contact}}
- Departure: {{departure_time}} ({{departure_date}})
- Arrival: {{arrival_time}} ({{arrival_date}})

📦 Order Items:
{{#each shipped_items}}
- {{product_name}} ({{model_name}} / {{variant_name}})
{{/each}}

🔗 View Full Shipment Details:
{{shipment_tracking_link}}

⚠️ Note: Shipment images are available for *7 days only*.

For support:
📞 {{support_contact_number}}

Safe travels for your order 🚍  
{{company_name}}`;

    const whatsappTemplate = `Hello {{customer_name}} 🚍

Your order from *{{company_name}}* is now on the way!

🧾 Order ID: {{order_id}}
🚌 Bus No: {{bus_number}}
👤 Driver: {{driver_contact}}
🕒 Departure: {{departure_time}} ({{departure_date}})
🕘 Arrival: {{arrival_time}} ({{arrival_date}})

🔗 Shipment Details:
{{shipment_tracking_link}}
(Images expire in 7 days)

📞 Support: {{support_contact_number}}

Thank you for shopping with us 🙏`;

    return await sendNotification({
        email: customer.email,
        mobile: customer.mobile,
        subject: 'Your Order is On the Way 🚍 | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            customer_name: customer.name,
            order_id: order.invoiceNumber || order._id.toString(),
            bus_number: order.busDetails?.busNumber || 'TBD',
            driver_contact: order.busDetails?.driverContact || 'TBD',
            departure_time: order.busDetails?.departureTime ? new Date(order.busDetails.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            departure_date: order.busDetails?.departureTime ? new Date(order.busDetails.departureTime).toLocaleDateString('en-IN') : 'TBD',
            arrival_time: order.busDetails?.expectedArrival ? new Date(order.busDetails.expectedArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            arrival_date: order.busDetails?.expectedArrival ? new Date(order.busDetails.expectedArrival).toLocaleDateString('en-IN') : 'TBD',
            shipped_items: shippedItems,
            shipment_tracking_link: shipmentTrackingLink
        }
    });
}

module.exports = {
    sendOrderConfirmation,
    sendOnDemandRequestConfirmation,
    sendMixedOrderConfirmation,
    sendShipmentDispatchNotification
};
