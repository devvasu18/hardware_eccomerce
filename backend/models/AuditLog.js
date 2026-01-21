const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true }, // e.g., 'UPDATE_ORDER', 'LOGIN', 'SYNC_TALLY'
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String }, // Snapshot of role at time of action
    targetResource: { type: String, required: true }, // e.g., 'Order', 'Product'
    targetId: { type: String }, // ID of the resource
    details: { type: Object }, // Before/After or Metadata
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
