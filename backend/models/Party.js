const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phone_no: {
        type: String
    },
    gst_no: {
        type: String
    },
    address: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
