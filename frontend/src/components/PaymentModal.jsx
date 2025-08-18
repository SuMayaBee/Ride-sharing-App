import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';

const PaymentModal = ({ isOpen, onClose, rideData, onPaymentSuccess }) => {
    const { processPayment, getPaymentMethods, paymentMethods, loading } = usePayment();
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: ''
    });
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getPaymentMethods();
        }
    }, [isOpen]);

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        
        // Format card number with spaces
        if (name === 'cardNumber') {
            const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.replace(/\s/g, '').length <= 16) {
                setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
            }
        } else if (name === 'cvv') {
            if (value.length <= 4 && /^\d*$/.test(value)) {
                setCardDetails(prev => ({ ...prev, [name]: value }));
            }
        } else if (name === 'expiryMonth' || name === 'expiryYear') {
            if (/^\d*$/.test(value)) {
                setCardDetails(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setCardDetails(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        setError('');

        try {
            const paymentData = {
                rideId: rideData.id,
                amount: rideData.fare,
                paymentMethod: selectedMethod,
                ...(selectedMethod === 'card' && {
                    cardDetails: {
                        ...cardDetails,
                        cardNumber: cardDetails.cardNumber.replace(/\s/g, '')
                    }
                })
            };

            const result = await processPayment(paymentData);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onPaymentSuccess(result.payment);
                    onClose();
                    setSuccess(false);
                }, 2000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Payment processing failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const isFormValid = () => {
        if (selectedMethod === 'card') {
            return (
                cardDetails.cardNumber.replace(/\s/g, '').length >= 13 &&
                cardDetails.expiryMonth &&
                cardDetails.expiryYear &&
                cardDetails.cvv.length >= 3 &&
                cardDetails.cardholderName.trim()
            );
        }
        return true;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {success ? (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-check-line text-green-600 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h3>
                        <p className="text-gray-600">Your payment has been processed successfully.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-800">Complete Payment</h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                    disabled={processing}
                                >
                                    <i className="ri-close-line text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Ride Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h3 className="font-medium text-gray-800 mb-2">Ride Summary</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Pickup:</span>
                                        <span className="text-right max-w-48 truncate">{rideData.pickup}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Destination:</span>
                                        <span className="text-right max-w-48 truncate">{rideData.destination}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t">
                                        <span>Total Amount:</span>
                                        <span>${rideData.fare}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-800 mb-3">Payment Method</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={selectedMethod === 'card'}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <i className="ri-bank-card-line text-xl mr-2"></i>
                                        <span>Credit/Debit Card</span>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={selectedMethod === 'paypal'}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <i className="ri-paypal-line text-xl mr-2 text-blue-600"></i>
                                        <span>PayPal</span>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="google_pay"
                                            checked={selectedMethod === 'google_pay'}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <i className="ri-google-line text-xl mr-2 text-red-500"></i>
                                        <span>Google Pay</span>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="apple_pay"
                                            checked={selectedMethod === 'apple_pay'}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <i className="ri-apple-line text-xl mr-2"></i>
                                        <span>Apple Pay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Card Details Form */}
                            {selectedMethod === 'card' && (
                                <div className="mb-6">
                                    <h3 className="font-medium text-gray-800 mb-3">Card Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Cardholder Name
                                            </label>
                                            <input
                                                type="text"
                                                name="cardholderName"
                                                value={cardDetails.cardholderName}
                                                onChange={handleCardInputChange}
                                                placeholder="John Doe"
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                value={cardDetails.cardNumber}
                                                onChange={handleCardInputChange}
                                                placeholder="4242 4242 4242 4242"
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Month
                                                </label>
                                                <input
                                                    type="text"
                                                    name="expiryMonth"
                                                    value={cardDetails.expiryMonth}
                                                    onChange={handleCardInputChange}
                                                    placeholder="12"
                                                    maxLength="2"
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="text"
                                                    name="expiryYear"
                                                    value={cardDetails.expiryYear}
                                                    onChange={handleCardInputChange}
                                                    placeholder="2025"
                                                    maxLength="4"
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    CVV
                                                </label>
                                                <input
                                                    type="text"
                                                    name="cvv"
                                                    value={cardDetails.cvv}
                                                    onChange={handleCardInputChange}
                                                    placeholder="123"
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={processing || !isFormValid()}
                                className="w-full bg-black text-white p-4 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {processing ? (
                                    <>
                                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                                        Processing...
                                    </>
                                ) : (
                                    `Pay $${rideData.fare}`
                                )}
                            </button>

                            <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                                <i className="ri-shield-check-line mr-1"></i>
                                <span>Your payment information is secure and encrypted</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
