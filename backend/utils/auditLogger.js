const AuditLog = require('../models/AuditLog');

/**
 * Log an administrative action to the database.
 * @param {Object} params 
 * @param {String} params.action - e.g., 'UPDATE_PRODUCT'
 * @param {Object} params.req - Express Request object (to get user/ip)
 * @param {String} params.targetResource - 'Product', 'Order', etc.
 * @param {String} params.targetId - ID of the resource
 * @param {Object} params.details - JSON metadata
 */
const logAction = async ({ action, req, targetResource, targetId, details }) => {
    try {
        if (!req.user) return; // Only log authenticated actions

        await AuditLog.create({
            action,
            performedBy: req.user._id,
            role: req.user.role,
            targetResource,
            targetId,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Audit Logging Failed:', err.message);
        // Don't throw error to avoid breaking the main business flow
    }
};

module.exports = { logAction };
