const Payment = require('../models/payment.model');
const crypto = require('crypto');

// Dummy payment gateway service that simulates real payment processing
class PaymentGatewayService {
    constructor() {
        this.gatewayName = 'StripeConnect';
        this.apiVersion = '2023-10-16';
        this.processingFees = {
            card: 0.029, // 2.9%
            paypal: 0.034, // 3.4%
            apple_pay: 0.029,
            google_pay: 0.029,
            wallet: 0.015 // 1.5%
        };
    }

    // Simulate payment processing with realistic delays and responses
    async processPayment(paymentData) {
        const { amount, paymentMethod, cardDetails, metadata } = paymentData;
        
        // Simulate network delay (100-800ms)
        await this.simulateNetworkDelay();
        
        // Generate realistic transaction ID
        const transactionId = this.generateTransactionId();
        
        // Simulate payment gateway processing
        const gatewayResponse = await this.simulateGatewayProcessing(amount, paymentMethod);
        
        // Calculate processing fee
        const processingFee = Math.round(amount * this.processingFees[paymentMethod] * 100) / 100;
        
        return {
            success: gatewayResponse.success,
            transactionId,
            gatewayResponse: {
                gatewayTransactionId: gatewayResponse.gatewayTransactionId,
                responseCode: gatewayResponse.responseCode,
                responseMessage: gatewayResponse.responseMessage,
                processingFee,
                exchangeRate: 1.0 // Assuming USD base currency
            },
            metadata: {
                ...metadata,
                processingTime: gatewayResponse.processingTime,
                riskScore: gatewayResponse.riskScore
            }
        };
    }

    async simulateGatewayProcessing(amount, paymentMethod) {
        // Simulate realistic success rate (97% success)
        const isSuccess = Math.random() > 0.03;
        
        // Generate gateway transaction ID
        const gatewayTransactionId = `pi_${crypto.randomBytes(12).toString('hex')}`;
        
        // Simulate processing time
        const processingTime = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
        
        // Generate risk score (0-100, lower is better)
        const riskScore = Math.floor(Math.random() * 30) + 1; // 1-30 (low risk)
        
        if (isSuccess) {
            return {
                success: true,
                gatewayTransactionId,
                responseCode: '00', // Success code
                responseMessage: 'Transaction approved',
                processingTime,
                riskScore
            };
        } else {
            // Simulate various failure reasons
            const failureReasons = [
                { code: '05', message: 'Insufficient funds' },
                { code: '14', message: 'Invalid card number' },
                { code: '54', message: 'Expired card' },
                { code: '61', message: 'Exceeds withdrawal limit' },
                { code: '91', message: 'Bank network unavailable' }
            ];
            
            const failure = failureReasons[Math.floor(Math.random() * failureReasons.length)];
            
            return {
                success: false,
                gatewayTransactionId: null,
                responseCode: failure.code,
                responseMessage: failure.message,
                processingTime,
                riskScore: Math.floor(Math.random() * 70) + 30 // Higher risk for failures
            };
        }
    }

    generateTransactionId() {
        const prefix = 'txn';
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `${prefix}_${timestamp}_${random}`;
    }

    async simulateNetworkDelay() {
        const delay = Math.floor(Math.random() * 700) + 100; // 100-800ms
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Simulate refund processing
    async processRefund(transactionId, amount, reason) {
        await this.simulateNetworkDelay();
        
        const refundId = `re_${crypto.randomBytes(12).toString('hex')}`;
        const isSuccess = Math.random() > 0.05; // 95% success rate for refunds
        
        return {
            success: isSuccess,
            refundId: isSuccess ? refundId : null,
            responseCode: isSuccess ? '00' : '12',
            responseMessage: isSuccess ? 'Refund processed successfully' : 'Refund failed - contact support'
        };
    }
}

// Main payment service
class PaymentService {
    constructor() {
        this.gateway = new PaymentGatewayService();
    }

    async createPayment(paymentData) {
        const { userId, rideId, amount, paymentMethod, cardDetails, metadata } = paymentData;
        
        try {
            // Create payment record with pending status
            const payment = new Payment({
                user: userId,
                ride: rideId,
                amount,
                paymentMethod,
                transactionId: this.gateway.generateTransactionId(),
                status: 'pending',
                cardDetails: paymentMethod === 'card' ? {
                    last4Digits: cardDetails?.cardNumber?.slice(-4) || '****',
                    cardType: this.detectCardType(cardDetails?.cardNumber),
                    expiryMonth: cardDetails?.expiryMonth,
                    expiryYear: cardDetails?.expiryYear
                } : undefined,
                metadata
            });

            await payment.save();

            // Process payment through gateway
            payment.status = 'processing';
            await payment.save();

            const gatewayResult = await this.gateway.processPayment({
                amount,
                paymentMethod,
                cardDetails,
                metadata
            });

            // Update payment with gateway response
            payment.status = gatewayResult.success ? 'completed' : 'failed';
            payment.gatewayResponse = gatewayResult.gatewayResponse;
            
            if (gatewayResult.success) {
                payment.transactionId = gatewayResult.transactionId;
            }

            await payment.save();

            return {
                success: gatewayResult.success,
                payment,
                message: gatewayResult.success ? 'Payment processed successfully' : 'Payment failed'
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            throw new Error('Payment processing failed');
        }
    }

    async getPaymentHistory(userId, limit = 10, offset = 0) {
        try {
            const payments = await Payment.find({ user: userId })
                .populate('ride', 'pickup destination fare')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);

            return payments;
        } catch (error) {
            throw new Error('Failed to fetch payment history');
        }
    }

    async processRefund(paymentId, refundAmount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            
            if (!payment || payment.status !== 'completed') {
                throw new Error('Payment not found or not eligible for refund');
            }

            const refundResult = await this.gateway.processRefund(
                payment.transactionId,
                refundAmount,
                reason
            );

            if (refundResult.success) {
                payment.status = 'refunded';
                payment.refundDetails = {
                    refundId: refundResult.refundId,
                    refundAmount,
                    refundReason: reason,
                    refundedAt: new Date()
                };
                await payment.save();
            }

            return {
                success: refundResult.success,
                message: refundResult.responseMessage,
                refundId: refundResult.refundId
            };

        } catch (error) {
            throw new Error('Refund processing failed');
        }
    }

    detectCardType(cardNumber) {
        if (!cardNumber) return 'unknown';
        
        const number = cardNumber.replace(/\s/g, '');
        
        if (/^4/.test(number)) return 'visa';
        if (/^5[1-5]/.test(number)) return 'mastercard';
        if (/^3[47]/.test(number)) return 'amex';
        if (/^6(?:011|5)/.test(number)) return 'discover';
        
        return 'unknown';
    }
}

module.exports = new PaymentService();
