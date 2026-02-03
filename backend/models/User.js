const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String }, // Optional
    password: { type: String, required: true, select: false }, // Hashed automatically
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
    // address: { type: String }, // Deprecated in favor of savedAddresses
    savedAddresses: [{
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        isDefault: { type: Boolean, default: false }
    }],
    wholesaleDiscount: { type: Number, default: 0 }, // Percentage discount for wholesale customers
    tallyLedgerName: { type: String }, // To map to Tally Ledger
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
