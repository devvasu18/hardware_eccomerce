const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema({
    party_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    invoice_no: {
        type: String,
        required: true,
        unique: true
    },
    bill_date: {
        type: Date,
        required: true
    },
    final_bill_amount: {
        type: Number,
        required: true
    },
    final_bill_amount_without_tax: {
        type: Number,
        required: true
    },
    cgst: {
        type: Number,
        default: 0
    },
    sgst: {
        type: Number,
        default: 0
    },
    // Tally Sync Status
    tallyStatus: {
        type: String,
        enum: ['pending', 'queued', 'saved', 'failed'],
        default: 'pending'
    },
    tallyErrorLog: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('StockEntry', stockEntrySchema);
