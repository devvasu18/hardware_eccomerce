const { sendNotification, getSystemSettings } = require('./notificationService');

/**
 * Check if a product or its variants are below the threshold and send alerts to admin
 */
async function checkLowStockAlert(product, itemContext = null) {
    try {
        const settings = await getSystemSettings();

        if (!settings.lowStockAlertsEnabled) return;

        const globalThreshold = settings.lowStockThreshold || 10;

        // Identify the specific stock level that was just updated
        let currentStock = 0;
        let itemName = product.title || product.name;
        let threshold = product.low_stock_threshold || globalThreshold;

        if (itemContext && itemContext.modelId) {
            const model = product.models.find(m => m._id.toString() === itemContext.modelId);
            if (model) {
                itemName += ` (${model.name})`;
                if (itemContext.variationId) {
                    const variant = model.variations.find(v => v._id.toString() === itemContext.variationId);
                    if (variant) {
                        currentStock = variant.stock;
                        itemName += ` - ${variant.value}`;
                    }
                }
            }
        } else if (itemContext && itemContext.variationId) {
            const variant = product.variations.find(v => v._id.toString() === itemContext.variationId);
            if (variant) {
                currentStock = variant.stock;
                itemName += ` (${variant.value})`;
            }
        } else {
            currentStock = product.stock;
        }

        // Only send if it's below or at the threshold
        if (currentStock <= threshold) {
            const adminEmail = process.env.ADMIN_EMAIL || settings.supportEmail;
            const adminMobile = process.env.ADMIN_MOBILE || settings.supportContactNumber;

            const subject = `⚠️ Low Stock Alert: ${itemName}`;
            const emailBody = `Hello Admin,\n\nThe following product is running low on stock:\n\nProduct: ${itemName}\nCurrent Stock: ${currentStock}\nThreshold: ${threshold}\n\nPlease restock soon to avoid running out.\n\nThank you,\n${settings.companyName}`;
            const whatsappBody = `⚠️ *Low Stock Alert* ⚠️\n\nProduct: *${itemName}*\nCurrent Stock: *${currentStock}*\nThreshold: *${threshold}*\n\nPlease restock soon. 🙏`;

            await sendNotification({
                email: adminEmail,
                mobile: adminMobile,
                subject,
                emailBody,
                whatsappBody,
                variables: {
                    product_name: itemName,
                    current_stock: currentStock,
                    threshold: threshold
                }
            });

            console.log(`[Low Stock Alert] Notification queued for ${itemName} (Stock: ${currentStock})`);
        }
    } catch (error) {
        console.error('Error in checkLowStockAlert:', error);
    }
}

module.exports = {
    checkLowStockAlert
};
