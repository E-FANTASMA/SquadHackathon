const xlsx = require('xlsx');
const { supabaseAdmin } = require('../config/supabase');
const storageUtils = require('../utils/storageUtils');
const squadService = require('../services/squadService');
const VirtualAccount = require('../models/VirtualAccount');
const Transfer = require('../models/Transfer');
const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

const payrollController = {
    /**
     * Create a Virtual Account for a Ministry/Agency
     * POST /api/payroll/create-virtual-account
     */
    createVirtualAccount: async (req, res) => {
        try {
            const { ministry_name, board_name, mobile_num, dob, email, bvn, ministry_id } = req.body;

            // 1. Call Squad API to create virtual account
            const squadResponse = await squadService.createVirtualAccount({
                first_name: ministry_name,
                last_name: board_name,
                mobile_num,
                dob,
                email,
                bvn,
                ministry_id
            });

            if (squadResponse.status !== 200) {
                throw new Error(squadResponse.message || 'Failed to create virtual account with Squad');
            }

            const { account_name, account_number, bank_name, virtual_account_reference } = squadResponse.data;

            // 2. Store in database
            const virtualAccount = await VirtualAccount.create({
                ministry_id,
                ministry_name,
                account_name,
                account_number,
                bank_name,
                virtual_account_reference
            });

            // 3. Log the event
            await AuditLog.log(
                'VIRTUAL_ACCOUNT_CREATED',
                `Created virtual account for ${ministry_name}`,
                req.user?.id,
                { virtual_account_reference, account_number }
            );

            res.status(201).json({
                message: 'Virtual account created successfully',
                data: virtualAccount
            });

        } catch (error) {
            console.error('Create Virtual Account error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Disburse salary to approved workers
     * POST /api/payroll/disburse
     */
    disburse: async (req, res) => {
        try {
            const { workerRecordId, employeeId, bank_code } = req.body;
            const id = workerRecordId || employeeId;

            if (!id) {
                return res.status(400).json({ error: 'Worker ID is required' });
            }

            // 1. Fetch worker record and check AI approval status
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('payroll_workers')
                .select('*, payroll_batches(batch_name)')
                .eq('id', id)
                .single();

            if (workerError || !worker) {
                return res.status(404).json({ error: 'Worker record not found' });
            }

            // Fetch bank_code from workers table if not provided
            let finalBankCode = bank_code;
            if (!finalBankCode) {
                const { data: workerProfile, error: profileError } = await supabaseAdmin
                    .from('workers')
                    .select('bank_code')
                    .eq('nin', worker.nin)
                    .single();
                
                if (workerProfile && workerProfile.bank_code) {
                    finalBankCode = workerProfile.bank_code;
                } else {
                    return res.status(400).json({ error: 'Bank code is required for disbursement' });
                }
            }

            // CORE RULE: NO AI APPROVAL = NO PAYMENT
            if (worker.verification_status !== 'verified') {
                await AuditLog.log(
                    'PAYMENT_BLOCKED',
                    `Payment blocked for worker ${worker.full_name} due to lack of AI approval.`,
                    req.user?.id,
                    { worker_id: worker.id, status: worker.verification_status }
                );
                return res.status(403).json({ 
                    error: 'Payment blocked: Worker has not been approved by the AI risk engine.' 
                });
            }

            // 2. Generate unique reference
            const baseReference = uuidv4();

            // 3. MANDATORY: Perform Account Lookup before transfer
            const lookupResponse = await squadService.accountLookup(finalBankCode, worker.account_number);
            
            if (!lookupResponse.success || !lookupResponse.data) {
                await AuditLog.log(
                    'TRANSFER_FAILED',
                    `Account lookup failed for worker ${worker.full_name}`,
                    req.user?.id,
                    { worker_id: worker.id, bank_code: finalBankCode, account_number: worker.account_number }
                );
                return res.status(400).json({ 
                    error: 'Account lookup failed. Please verify the bank details.',
                    details: lookupResponse.message 
                });
            }

            const verifiedAccountName = lookupResponse.data.account_name;

            // 4. Initiate Squad Transfer using the verified account name
            const squadResponse = await squadService.disburseFunds(
                worker.salary_amount,
                finalBankCode,
                worker.account_number,
                verifiedAccountName,
                baseReference
            );

            // 5. Store transfer record
            const transferReference = `${process.env.SQUAD_MERCHANT_ID || 'MERCHANT_ID'}_${baseReference}`;
            const transferData = {
                worker_id: worker.id,
                worker_name: worker.full_name,
                account_number: worker.account_number,
                bank_code: finalBankCode,
                amount: worker.salary_amount,
                payroll_batch_id: worker.payroll_batch_id,
                transfer_reference: transferReference,
                squad_transaction_ref: squadResponse.data?.transaction_reference,
                status: squadResponse.status === 200 ? 'success' : 'failed',
                error_log: squadResponse.status !== 200 ? squadResponse.message : null
            };

            const transfer = await Transfer.create(transferData);

            // 5. Log the outcome
            const eventType = squadResponse.status === 200 ? 'TRANSFER_SUCCESS' : 'TRANSFER_FAILED';
            await AuditLog.log(
                eventType,
                `${eventType === 'TRANSFER_SUCCESS' ? 'Successful' : 'Failed'} transfer to ${worker.full_name}`,
                req.user?.id,
                { transfer_reference: transferReference, amount: worker.salary_amount }
            );

            if (squadResponse.status !== 200) {
                return res.status(400).json({ 
                    error: 'Transfer failed', 
                    details: squadResponse.message 
                });
            }

            res.status(200).json({
                message: 'Disbursement initiated successfully',
                transfer
            });

        } catch (error) {
            console.error('Disbursement error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * General wallet funding (not tied to a batch)
     * POST /api/company/wallet/fund
     */
    fundWallet: async (req, res) => {
        try {
            const { amount, email } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valid amount is required' });
            }

            // Initiate payment via Squad
            const transactionRef = `WAL-${uuidv4()}`;
            const squadResponse = await squadService.initiatePayment({
                amount: amount,
                email: email || req.user?.email || 'finance@ministry.gov.ng',
                transaction_ref: transactionRef,
                metadata: { event_type: 'WALLET_FUNDING' }
            });

            // Log event
            await AuditLog.log(
                'WALLET_FUNDING_INITIATED',
                `Wallet funding initiated for ${amount}`,
                req.user?.id,
                { transaction_ref: transactionRef, amount }
            );

            res.status(200).json({
                ok: true,
                message: 'Funding initiated',
                checkout_url: squadResponse.data.checkout_url,
                transaction_ref: transactionRef
            });

        } catch (error) {
            console.error('Fund wallet error:', error);
            res.status(500).json({ ok: false, error: error.message, failure: { code: 'ERR_SQUAD_INIT', ref: `ERR-${Date.now()}` } });
        }
    },

    /**
     * Initiate funding for a payroll batch
     * POST /api/payroll/initiate-funding
     */
    initiateFunding: async (req, res) => {
        try {
            const { batchId, email } = req.body;

            // 1. Get batch details
            const { data: batch, error: batchError } = await supabaseAdmin
                .from('payroll_batches')
                .select('*')
                .eq('id', batchId)
                .single();

            if (batchError || !batch) {
                return res.status(404).json({ error: 'Payroll batch not found' });
            }

            // 2. Initiate payment via Squad
            const transactionRef = `FUND-${uuidv4()}`;
            const squadResponse = await squadService.initiatePayment({
                amount: batch.total_amount,
                email: email || 'finance@ministry.gov.ng',
                transaction_ref: transactionRef,
                metadata: { batch_id: batchId, event_type: 'PAYROLL_FUNDING' }
            });

            // 3. Log event
            await AuditLog.log(
                'FUNDING_INITIATED',
                `Funding initiated for batch ${batch.batch_name}`,
                req.user?.id,
                { batch_id: batchId, transaction_ref: transactionRef, amount: batch.total_amount }
            );

            res.status(200).json({
                message: 'Funding initiated. Please complete payment using the checkout URL.',
                checkout_url: squadResponse.data.checkout_url,
                transaction_ref: transactionRef
            });

        } catch (error) {
            console.error('Initiate funding error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Simulate a funding payment (Sandbox only)
     * POST /api/payroll/simulate-funding
     */
    simulateFunding: async (req, res) => {
        try {
            const { virtual_account_number, amount, batchId } = req.body;

            // 1. Call Squad simulate API
            const squadResponse = await squadService.simulatePayment(virtual_account_number, amount);

            // 2. Update batch status in database to 'funded'
            const { error: updateError } = await supabaseAdmin
                .from('payroll_batches')
                .update({ status: 'funded' })
                .eq('id', batchId);

            if (updateError) throw updateError;

            // 3. Log success
            await AuditLog.log(
                'FUNDING_SUCCESS',
                `Successfully simulated funding for batch ${batchId}`,
                req.user?.id,
                { batch_id: batchId, amount, virtual_account_number }
            );

            res.status(200).json({
                message: 'Payment simulation successful. Batch is now funded.',
                data: squadResponse.data
            });

        } catch (error) {
            console.error('Simulate funding error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Verify a transfer status
     * GET /api/payroll/verify/:reference
     */
    verifyTransfer: async (req, res) => {
        try {
            const { reference } = req.params;

            // 1. Call Squad to verify
            const squadResponse = await squadService.verifyTransaction(reference);

            // 2. Update transfer record in DB
            const updateData = {
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
                status: squadResponse.data?.transaction_status === 'success' ? 'success' : 'failed'
            };

            const updatedTransfer = await Transfer.update(reference, updateData);

            // 3. Log verification
            await AuditLog.log(
                'TRANSFER_VERIFIED',
                `Verified status for transfer ${reference}`,
                req.user?.id,
                { reference, status: updatedTransfer.status }
            );

            res.status(200).json({
                message: 'Transfer verified',
                data: updatedTransfer,
                squadDetails: squadResponse.data
            });

        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // --- Original methods preserved ---

    uploadPayroll: async (req, res) => {
        try {
            const { batch_name } = req.body;
            const company_id = req.profile.company_id;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            if (!batch_name) {
                return res.status(400).json({ error: 'Batch name is required' });
            }

            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            if (data.length === 0) {
                return res.status(400).json({ error: 'Excel file is empty' });
            }

            const requiredColumns = ['full_name', 'nin', 'account_number', 'salary_amount'];
            const firstRow = data[0];
            for (const col of requiredColumns) {
                if (!(col in firstRow)) {
                    return res.status(400).json({ error: `Missing required column: ${col}` });
                }
            }

            const fileName = `${company_id}/${Date.now()}_${req.file.originalname}`;
            await storageUtils.uploadFile('payroll_excels', fileName, req.file.buffer, req.file.mimetype);

            const total_workers = data.length;
            const total_amount = data.reduce((sum, row) => sum + parseFloat(row.salary_amount || 0), 0);

            const { data: batchData, error: batchError } = await supabaseAdmin
                .from('payroll_batches')
                .insert([
                    { 
                        company_id, 
                        batch_name, 
                        total_workers, 
                        total_amount,
                        status: 'pending'
                    }
                ])
                .select()
                .single();

            if (batchError) throw batchError;

            const payrollWorkers = data.map(row => ({
                payroll_batch_id: batchData.id,
                full_name: row.full_name,
                nin: row.nin.toString(),
                account_number: row.account_number.toString(),
                salary_amount: parseFloat(row.salary_amount),
                worker_claimed: false,
                verification_status: 'pending'
            }));

            const { error: workersError } = await supabaseAdmin
                .from('payroll_workers')
                .insert(payrollWorkers);

            if (workersError) throw workersError;

            res.status(201).json({
                message: 'Payroll batch uploaded and processed successfully',
                batch: batchData,
                workerCount: payrollWorkers.length
            });

        } catch (error) {
            console.error('Payroll upload error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getPayrollBatches: async (req, res) => {
        try {
            const company_id = req.profile.company_id;

            const { data, error } = await supabaseAdmin
                .from('payroll_batches')
                .select('*')
                .eq('company_id', company_id)
                .order('upload_date', { ascending: false });

            if (error) throw error;

            res.status(200).json(data);
        } catch (error) {
            console.error('Get batches error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getBatchWorkers: async (req, res) => {
        try {
            const { batchId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('payroll_workers')
                .select('*')
                .eq('payroll_batch_id', batchId);

            if (error) throw error;

            res.status(200).json(data);
        } catch (error) {
            console.error('Get batch workers error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    updateWorkerStatus: async (req, res) => {
        try {
            const { workerRecordId, status } = req.body;
            const company_id = req.profile.company_id;

            if (!['verified', 'rejected', 'flagged'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const { data, error } = await supabaseAdmin
                .from('payroll_workers')
                .update({ verification_status: status })
                .eq('id', workerRecordId)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json({
                message: `Worker status updated to ${status}`,
                data
            });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = payrollController;
