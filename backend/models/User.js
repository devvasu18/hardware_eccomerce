const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String }, // Optional
    password: { type: String, required: true }, // Simple auth for now
    role: {
        type: String,
        enum: ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'customer'],
        default: 'customer'
    },
    customerType: {
        type: String,
        enum: ['regular', 'specialCustomer', 'superSpecialCustomer', 'wholesale'],
        default: 'regular'
    },
    address: { type: String },
    wholesaleDiscount: { type: Number, default: 0 }, // Percentage discount for wholesale customers
    tallyLedgerName: { type: String }, // To map to Tally Ledger
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
