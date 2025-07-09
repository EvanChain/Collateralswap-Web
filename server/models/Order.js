const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true
    },
    collateralToken: {
        type: String,
        required: true
    },
    debtToken: {
        type: String,
        required: true
    },
    collateralAmount: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'FILLED', 'CANCELLED'],
        default: 'OPEN'
    },
    filledAmount: {
        type: String,
        default: '0'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
