const paymentService = require('../services/payment.service');
const Payment = require('../models/payment.model');
const { validationResult } = require('express-validator');

module.exports.processPayment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            rideId,
            amount,
            paymentMethod,
            cardDetails,
            saveCard = false
        } = req.body;

        const userId = req.user._id;

        // Get client metadata for fraud detection
        const metadata = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            deviceId: req.get('X-Device-Id') || 'unknown',
            timestamp: new Date().toISOString()
        };

        const result = await paymentService.createPayment({
            userId,
            rideId,
            amount,
            paymentMethod,
            cardDetails,
            metadata
        });

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Payment processed successfully',
                payment: {
                    id: result.payment._id,
                    transactionId: result.payment.transactionId,
                    amount: result.payment.amount,
                    status: result.payment.status,
                    paymentMethod: result.payment.paymentMethod,
                    processingFee: result.payment.gatewayResponse?.processingFee || 0,
                    createdAt: result.payment.createdAt
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Payment failed',
                errorCode: result.payment?.gatewayResponse?.responseCode
            });
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: `Internal server error during payment processing ${error.message}`
        });
    }
};

module.exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 10, offset = 0 } = req.query;

        const payments = await paymentService.getPaymentHistory(
            userId,
            parseInt(limit),
            parseInt(offset)
        );

        res.status(200).json({
            success: true,
            payments: payments.map(payment => ({
                id: payment._id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                ride: payment.ride,
                createdAt: payment.createdAt,
                cardDetails: payment.cardDetails ? {
                    last4Digits: payment.cardDetails.last4Digits,
                    cardType: payment.cardDetails.cardType
                } : null
            }))
        });

    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch payment history ${error.message}`
        });
    }
};

module.exports.getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user._id;

        const payment = await Payment.findOne({ 
            _id: paymentId, 
            user: userId 
        }).populate('ride', 'pickup destination fare status');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            payment: {
                id: payment._id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                ride: payment.ride,
                gatewayResponse: payment.gatewayResponse,
                cardDetails: payment.cardDetails,
                refundDetails: payment.refundDetails,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }
        });

    } catch (error) {
        console.error('Payment details error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch payment details ${error.message}`
        });
    }
};

module.exports.requestRefund = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { refundAmount, reason } = req.body;
        const userId = req.user._id;

        // Verify payment belongs to user
        const payment = await Payment.findOne({ 
            _id: paymentId, 
            user: userId 
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const result = await paymentService.processRefund(
            paymentId,
            refundAmount || payment.amount,
            reason || 'Customer requested refund'
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Refund processed successfully',
                refundId: result.refundId
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to process refund ${error.message}`
        });
    }
};

module.exports.getPaymentMethods = async (req, res) => {
    try {
        // Simulate stored payment methods for the user
        const paymentMethods = [
            {
                id: 'pm_card_visa_1234',
                type: 'card',
                card: {
                    brand: 'visa',
                    last4: '4242',
                    expiryMonth: 12,
                    expiryYear: 2025
                },
                isDefault: true
            },
            {
                id: 'pm_paypal_user',
                type: 'paypal',
                paypal: {
                    email: req.user.email
                },
                isDefault: false
            }
        ];

        res.status(200).json({
            success: true,
            paymentMethods
        });

    } catch (error) {
        console.error('Payment methods error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch payment methods ${error.message}`
        });
    }
};
