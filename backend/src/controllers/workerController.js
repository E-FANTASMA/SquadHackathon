const { supabaseAdmin } = require('../config/supabase');
const storageUtils = require('../utils/storageUtils');

const workerController = {
    claimRecord: async (req, res) => {
        try {
            const { account_number, bank_name } = req.body;
            const user_id = req.user.id;

            // 1. Get worker profile
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('workers')
                .select('*')
                .eq('user_id', user_id)
                .single();

            if (workerError) throw workerError;

            // 2. Find matching payroll record
            // Matching logic: NIN and Account Number
            const { data: payrollRecord, error: payrollError } = await supabaseAdmin
                .from('payroll_workers')
                .select('*')
                .eq('nin', worker.nin)
                .eq('account_number', account_number)
                .eq('worker_claimed', false)
                .maybeSingle();

            if (payrollError) throw payrollError;

            if (!payrollRecord) {
                return res.status(404).json({ 
                    error: 'No matching unclaimed payroll record found. Please verify your NIN and account number.' 
                });
            }

            // 3. Update worker profile with bank details
            const { error: updateWorkerError } = await supabaseAdmin
                .from('workers')
                .update({ account_number, bank_name })
                .eq('id', worker.id);

            if (updateWorkerError) throw updateWorkerError;

            // 4. Mark payroll record as claimed
            const { error: updatePayrollError } = await supabaseAdmin
                .from('payroll_workers')
                .update({ worker_claimed: true })
                .eq('id', payrollRecord.id);

            if (updatePayrollError) throw updatePayrollError;

            res.status(200).json({
                message: 'Payroll record claimed successfully',
                payrollRecord
            });

        } catch (error) {
            console.error('Claim record error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    uploadDocuments: async (req, res) => {
        try {
            const user_id = req.user.id;
            const { files } = req; // Expecting multiple files

            if (!files || (!files.statement && !files.screenshot)) {
                return res.status(400).json({ error: 'Please upload at least one document (statement or screenshot)' });
            }

            // Get worker id
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('workers')
                .select('id')
                .eq('user_id', user_id)
                .single();

            if (workerError) throw workerError;

            let statement_url = null;
            let screenshot_url = null;

            // Upload statement if provided
            if (files.statement) {
                const statementFile = files.statement[0];
                const path = `${worker.id}/statements/${Date.now()}_${statementFile.originalname}`;
                await storageUtils.uploadFile('statements', path, statementFile.buffer, statementFile.mimetype);
                statement_url = storageUtils.getPublicUrl('statements', path);
            }

            // Upload screenshot if provided
            if (files.screenshot) {
                const screenshotFile = files.screenshot[0];
                const path = `${worker.id}/screenshots/${Date.now()}_${screenshotFile.originalname}`;
                await storageUtils.uploadFile('screenshots', path, screenshotFile.buffer, screenshotFile.mimetype);
                screenshot_url = storageUtils.getPublicUrl('screenshots', path);
            }

            // Record upload in database
            const { data: uploadRecord, error: uploadError } = await supabaseAdmin
                .from('worker_uploads')
                .insert([
                    {
                        worker_id: worker.id,
                        statement_url,
                        screenshot_url,
                        upload_status: 'pending'
                    }
                ])
                .select()
                .single();

            if (uploadError) throw uploadError;

            res.status(201).json({
                message: 'Documents uploaded successfully',
                uploadRecord
            });

        } catch (error) {
            console.error('Upload documents error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getStatus: async (req, res) => {
        try {
            const user_id = req.user.id;

            const { data, error } = await supabaseAdmin
                .from('workers')
                .select('*, worker_uploads(*)')
                .eq('user_id', user_id)
                .single();

            if (error) throw error;

            res.status(200).json(data);
        } catch (error) {
            console.error('Get status error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = workerController;
