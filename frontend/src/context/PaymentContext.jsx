import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const PaymentContext = createContext();

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
};

export const PaymentProvider = ({ children }) => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);

    const processPayment = async (paymentData) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/payments/process`,
                paymentData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setCurrentPayment(response.data.payment);
                return { success: true, payment: response.data.payment };
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Payment processing failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Payment failed. Please try again.' 
            };
        } finally {
            setLoading(false);
        }
    };

    const getPaymentHistory = async (limit = 10, offset = 0) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/payments/history?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setPaymentHistory(response.data.payments);
                return response.data.payments;
            }
        } catch (error) {
            console.error('Failed to fetch payment history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethods = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/payments/methods/saved`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setPaymentMethods(response.data.paymentMethods);
                return response.data.paymentMethods;
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestRefund = async (paymentId, refundAmount, reason) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/payments/${paymentId}/refund`,
                { refundAmount, reason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { success: response.data.success, message: response.data.message };
        } catch (error) {
            console.error('Refund request failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Refund request failed' 
            };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        paymentMethods,
        paymentHistory,
        currentPayment,
        loading,
        processPayment,
        getPaymentHistory,
        getPaymentMethods,
        requestRefund,
        setCurrentPayment
    };

    return (
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    );
};
