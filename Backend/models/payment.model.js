const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR']
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'wallet']
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentGateway: {
        type: String,
        default: 'stripe',
        enum: ['stripe', 'paypal', 'razorpay', 'square']
    },
    gatewayResponse: {
        gatewayTransactionId: String,
        responseCode: String,
        responseMessage: String,
        processingFee: Number,
        exchangeRate: Number
    },
    cardDetails: {
        last4Digits: String,
        cardType: String,
        expiryMonth: Number,
        expiryYear: Number
    },
    refundDetails: {
        refundId: String,
        refundAmount: Number,
        refundReason: String,
        refundedAt: Date
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceId: String
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ ride: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('payment', paymentSchema);
