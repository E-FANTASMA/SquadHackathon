const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;
const SQUAD_BASE_URL = process.env.SQUAD_BASE_URL || 'https://api.squadco.com';

const squadApi = axios.create({
    baseURL: SQUAD_BASE_URL,
    headers: {
        'Authorization': `Bearer ${SQUAD_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});

const squadService = {
    // Verify Bank Account
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
    },

    // Verify NIN
    verifyNIN: async (nin) => {
        try {
            // Note: Check Squad docs for the exact NIN verification endpoint
            // This is a placeholder based on typical Squad API patterns
            const response = await squadApi.post('/verifications/nin', {
                nin
            });
            return response.data;
        } catch (error) {
            console.error('Squad NIN Verify Error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Initiate Payment (e.g., for company wallet funding)
    initiatePayment: async (amount, email, reference, metadata = {}) => {
        try {
            const response = await squadApi.post('/transaction/initiate', {
                amount: amount * 100, // Squad expects amount in kobo
                email,
                currency: 'NGN',
                initiate_type: 'inline',
                transaction_ref: reference,
                metadata
            });
            return response.data;
        } catch (error) {
            console.error('Squad Initiate Payment Error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Disburse Funds (Salary Payment)
    disburseFunds: async (amount, bank_code, account_number, account_name, reference) => {
        try {
            const response = await squadApi.post('/payout/transfer', {
                amount: amount * 100,
                bank_code,
                account_number,
                account_name,
                transaction_reference: reference,
                remark: 'Salary Payment'
            });
            return response.data;
        } catch (error) {
            console.error('Squad Payout Error:', error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = squadService;
