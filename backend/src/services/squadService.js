const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Squad API Service for PayGuard AI
 * Handles payments, virtual accounts, and transaction verification.
 */

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;
const SQUAD_MERCHANT_ID = process.env.SQUAD_MERCHANT_ID || 'MERCHANT_ID'; // Required for transfer references
// Default to sandbox as requested for integration
let SQUAD_BASE_URL = process.env.SQUAD_BASE_URL || 'https://sandbox-api-d.squadco.com';

// Ensure the URL has a protocol (required by Node.js URL constructor used by Axios)
if (SQUAD_BASE_URL && !SQUAD_BASE_URL.startsWith('http')) {
    SQUAD_BASE_URL = `https://${SQUAD_BASE_URL}`;
}

const squadApi = axios.create({
    baseURL: SQUAD_BASE_URL,
    headers: {
        'Authorization': `Bearer ${SQUAD_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});

const squadService = {
    /**
     * Account Lookup
     * Confirm the account name of the recipient before initiating a transfer.
     */
    accountLookup: async (bank_code, account_number) => {
        try {
            const response = await squadApi.post('/payout/account/lookup', {
                bank_code,
                account_number
            });
            return response.data;
        } catch (error) {
            console.error('Squad Account Lookup Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create a Virtual Account for a ministry or agency.
     */
    createVirtualAccount: async (userData) => {
        try {
            const response = await squadApi.post('/virtual-account', {
                first_name: userData.first_name,
                last_name: userData.last_name,
                middle_name: userData.middle_name || '',
                mobile_num: userData.mobile_num,
                dob: userData.dob,
                email: userData.email,
                bvn: userData.bvn,
                customer_identifier: userData.ministry_id
            });
            return response.data;
        } catch (error) {
            console.error('Squad Virtual Account Creation Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Disburse Funds (Salary Payment)
     * @param {number} amount - Amount in Naira (will be converted to Kobo)
     * @param {string} bank_code - Unique NIP code
     * @param {string} account_number - 10-digit NUBAN
     * @param {string} account_name - Looked-up account name
     * @param {string} reference - Base unique reference (Merchant ID will be appended)
     */
    disburseFunds: async (amount, bank_code, account_number, account_name, reference) => {
        try {
            // Requirement: Merchant ID must be appended to the transaction reference
            const transaction_reference = `${SQUAD_MERCHANT_ID}_${reference}`;

            const response = await squadApi.post('/payout/transfer', {
                transaction_reference,
                amount: Math.round(amount * 100).toString(), // Kobo as string
                bank_code,
                account_number,
                account_name,
                currency_id: 'NGN',
                remark: 'Salary Payment - PayGuard AI Approved'
            });
            return response.data;
        } catch (error) {
            console.error('Squad Payout Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Initiate Payment
     * Returns a checkout URL for the ministry to fund a payroll batch.
     */
    initiatePayment: async (paymentData) => {
        try {
            const response = await squadApi.post('/transaction/initiate', {
                amount: Math.round(paymentData.amount * 100).toString(),
                email: paymentData.email,
                currency: 'NGN',
                initiate_type: 'inline',
                transaction_ref: paymentData.transaction_ref,
                callback_url: paymentData.callback_url || 'http://localhost:5000/health',
                metadata: paymentData.metadata || {}
            });
            return response.data;
        } catch (error) {
            console.error('Squad Initiate Payment Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Simulate Payment (Sandbox Only)
     * Mocks a transfer into a dynamic virtual account for demo purposes.
     */
    simulatePayment: async (virtual_account_number, amount) => {
        try {
            const response = await squadApi.post('/virtual-account/simulate/payment', {
                virtual_account_number,
                amount: Math.round(amount * 100).toString()
            });
            return response.data;
        } catch (error) {
            console.error('Squad Simulate Payment Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Verify a transaction status using its reference.
     * @param {string} reference - Unique transaction reference
     */
    verifyTransaction: async (reference) => {
        try {
            const response = await squadApi.get(`/transaction/verify/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Squad Transaction Verification Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Verify Bank Account Details
     */
    verifyBankAccount: async (account_number, bank_code) => {
        try {
            const response = await squadApi.post('/bank/verify', {
                account_number,
                bank_code
            });
            return response.data;
        } catch (error) {
            console.error('Squad Bank Verify Error:', error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = squadService;
