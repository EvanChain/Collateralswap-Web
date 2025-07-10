const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        sparse: true // 允许null值，但如果有值必须唯一
    },
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
    interestRateMode: {
        type: String,
        default: '1'
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
    isFromBlockchain: {
        type: Boolean,
        default: false
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
