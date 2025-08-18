import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';

const PaymentHistory = () => {
    const { getPaymentHistory, paymentHistory, loading, requestRefund } = usePayment();
    const [expandedPayment, setExpandedPayment] = useState(null);
    const [refundModal, setRefundModal] = useState({ isOpen: false, payment: null });
    const [refundReason, setRefundReason] = useState('');

    useEffect(() => {
        getPaymentHistory();
    }, []);

    const handleRefundRequest = async () => {
        if (!refundModal.payment || !refundReason.trim()) return;

        const result = await requestRefund(
            refundModal.payment.id,
            refundModal.payment.amount,
            refundReason
        );

        if (result.success) {
            alert('Refund request submitted successfully!');
            getPaymentHistory(); // Refresh the list
        } else {
            alert('Refund request failed: ' + result.error);
        }

        setRefundModal({ isOpen: false, payment: null });
        setRefundReason('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'failed': return 'text-red-600 bg-red-50';
            case 'refunded': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'card': return 'ri-bank-card-line';
            case 'paypal': return 'ri-paypal-line';
            case 'google_pay': return 'ri-google-line';
            case 'apple_pay': return 'ri-apple-line';
            case 'wallet': return 'ri-wallet-line';
            default: return 'ri-money-dollar-circle-line';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <i className="ri-loader-4-line animate-spin text-4xl text-gray-400"></i>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment History</h1>
                <p className="text-gray-600">View and manage your payment transactions</p>
            </div>

            {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                    <i className="ri-file-list-line text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No payments yet</h3>
                    <p className="text-gray-400">Your payment history will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                        <div key={payment.id} className="bg-white border rounded-lg shadow-sm">
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedPayment(
                                    expandedPayment === payment.id ? null : payment.id
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <i className={`${getPaymentMethodIcon(payment.paymentMethod)} text-lg text-gray-600`}></i>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-gray-800">
                                                    ${payment.amount}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {payment.ride?.pickup || 'Ride payment'} → {payment.ride?.destination || 'Destination'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {payment.status === 'completed' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRefundModal({ isOpen: true, payment });
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Request Refund
                                            </button>
                                        )}
                                        <i className={`ri-arrow-${expandedPayment === payment.id ? 'up' : 'down'}-s-line text-gray-400`}></i>
                                    </div>
                                </div>
                            </div>

                            {expandedPayment === payment.id && (
                                <div className="border-t p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 mb-1">Transaction ID</p>
                                            <p className="font-medium text-gray-800">{payment.transactionId}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-1">Payment Method</p>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-800 capitalize">
                                                    {payment.paymentMethod.replace('_', ' ')}
                                                </span>
                                                {payment.cardDetails && (
                                                    <span className="text-gray-600">
                                                        •••• {payment.cardDetails.last4Digits}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {payment.ride && (
                                            <>
                                                <div>
                                                    <p className="text-gray-600 mb-1">Pickup Location</p>
                                                    <p className="font-medium text-gray-800">{payment.ride.pickup}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 mb-1">Destination</p>
                                                    <p className="font-medium text-gray-800">{payment.ride.destination}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Refund Modal */}
            {refundModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-800">Request Refund</h2>
                                <button
                                    onClick={() => setRefundModal({ isOpen: false, payment: null })}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <i className="ri-close-line text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-600">
                                    Request a refund for payment of <strong>${refundModal.payment?.amount}</strong>
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for refund
                                </label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Please provide a reason for the refund request..."
                                    rows="4"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setRefundModal({ isOpen: false, payment: null })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRefundRequest}
                                    disabled={!refundReason.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
