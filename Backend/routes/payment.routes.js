const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const paymentController = require('../controllers/payment.controller');


// Process payment
router.post('/process',
    authMiddleware.authUser,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Valid ride ID is required'),
        body('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be a positive number'),
        body('paymentMethod')
            .isIn(['card', 'paypal', 'apple_pay', 'google_pay', 'wallet'])
            .withMessage('Invalid payment method'),
        body('cardDetails.cardNumber')
            .if(body('paymentMethod').equals('card'))
            .matches(/^[0-9]{13,19}$/)
            .withMessage('Invalid card number'),
        body('cardDetails.expiryMonth')
            .if(body('paymentMethod').equals('card'))
            .isInt({ min: 1, max: 12 })
            .withMessage('Invalid expiry month'),
        body('cardDetails.expiryYear')
            .if(body('paymentMethod').equals('card'))
            .isInt({ min: new Date().getFullYear() })
            .withMessage('Invalid expiry year'),
        body('cardDetails.cvv')
            .if(body('paymentMethod').equals('card'))
            .matches(/^[0-9]{3,4}$/)
            .withMessage('Invalid CVV')
    ],
    paymentController.processPayment
);


// Get payment history
router.get('/history',
    authMiddleware.authUser,
    paymentController.getPaymentHistory
);


// Get payment details
router.get('/:paymentId',
    authMiddleware.authUser,
    paymentController.getPaymentDetails
);

// Request refund
router.post('/:paymentId/refund',
    authMiddleware.authUser,
    [
        body('refundAmount')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Refund amount must be a positive number'),
        body('reason')
            .optional()
            .isLength({ min: 3, max: 500 })
            .withMessage('Reason must be between 3 and 500 characters')
    ],
    paymentController.requestRefund
);

// Get saved payment methods
router.get('/methods/saved',
    authMiddleware.authUser,
    paymentController.getPaymentMethods
);

module.exports = router;
