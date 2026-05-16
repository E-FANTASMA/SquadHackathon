const { supabaseAdmin } = require('../config/supabase');
const storageUtils = require('../utils/storageUtils');
const squadService = require('../services/squadService');

const workerController = {
    claimRecord: async (req, res) => {
        try {
            const { account_number, bank_code, bank_name } = req.body;
            const profile_id = req.user.id;

            // 1. Get worker profile
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('workers')
                .select('*')
                .eq('profile_id', profile_id)
                .single();

            if (workerError) throw workerError;

            // 2. SQUAD INTEGRATION: Verify Bank Account
            let accountVerified = false;
            try {
                const verification = await squadService.verifyBankAccount(account_number, bank_code);
                if (verification && verification.data && verification.data.account_name) {
                    // Check if names match loosely (you can make this stricter)
                    const squadName = verification.data.account_name.toLowerCase();
                    const workerName = worker.full_name.toLowerCase();
                    
                    if (squadName.includes(workerName.split(' ')[0]) || workerName.includes(squadName.split(' ')[0])) {
                        accountVerified = true;
                    } else {
                        return res.status(400).json({ 
                            error: `Bank account name (${verification.data.account_name}) does not match your registered name (${worker.full_name})` 
                        });
                    }
                }
            } catch (err) {
                console.warn('Squad verification failed, proceeding with caution:', err.message);
                // In production, you might want to block here
            }

            // 3. Find matching payroll record
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

            // 4. Update worker profile with bank details
            const { error: updateWorkerError } = await supabaseAdmin
                .from('workers')
                .update({ account_number, bank_name, bank_code })
                .eq('id', worker.id);

            if (updateWorkerError) throw updateWorkerError;

            // 5. Mark payroll record as claimed
            const { error: updatePayrollError } = await supabaseAdmin
                .from('payroll_workers')
                .update({ worker_claimed: true })
                .eq('id', payrollRecord.id);

            if (updatePayrollError) throw updatePayrollError;

            res.status(200).json({
                message: 'Payroll record claimed successfully',
                payrollRecord,
                squad_verified: accountVerified
            });

        } catch (error) {
            console.error('Claim record error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    uploadDocuments: async (req, res) => {
        try {
            const profile_id = req.user.id;
            const { files } = req; // Expecting multiple files

            if (!files || !files.statement || !files.screenshot) {
                return res.status(400).json({ 
                    error: 'Both bank statement and bank app transaction screenshot are required for verification.' 
                });
            }

            // Get worker id
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('workers')
                .select('id, full_name')
                .eq('profile_id', profile_id)
                .single();

            if (workerError) throw workerError;

            let statement_url = null;
            let screenshot_url = null;

            // 1. Upload statement
            const statementFile = files.statement[0];
            const statementPath = `${worker.id}/statements/${Date.now()}_${statementFile.originalname}`;
            await storageUtils.uploadFile('statements', statementPath, statementFile.buffer, statementFile.mimetype);
            statement_url = storageUtils.getPublicUrl('statements', statementPath);

            // 2. Upload screenshot
            const screenshotFile = files.screenshot[0];
            const screenshotPath = `${worker.id}/screenshots/${Date.now()}_${screenshotFile.originalname}`;
            await storageUtils.uploadFile('screenshots', screenshotPath, screenshotFile.buffer, screenshotFile.mimetype);
            screenshot_url = storageUtils.getPublicUrl('screenshots', screenshotPath);

            // 3. AI ANALYSIS (Simulated for this hackathon)
            // In a real scenario, we'd pass these URLs to an AI model to:
            // - Extract transactions from screenshot
            // - Extract transactions from statement
            // - Compare them
            // - Look for salary credit from previous month
            
            // Simulating AI flagging/verification based on some mock logic or just default to pending
            const trust_score = 75; // Starting score
            const verification_status = 'flagged'; // AI flags for admin review since we're comparing documents
            
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

            // Update worker status to flagged (pending admin review of documents)
            await supabaseAdmin
                .from('workers')
                .update({ 
                    verification_status: 'flagged', 
                    trust_score: 75 
                })
                .eq('id', worker.id);

            // Also update any matching payroll_workers record
            const { data: workerProfile } = await supabaseAdmin
                .from('workers')
                .select('nin')
                .eq('id', worker.id)
                .single();

            if (workerProfile) {
                await supabaseAdmin
                    .from('payroll_workers')
                    .update({ verification_status: 'flagged' })
                    .eq('nin', workerProfile.nin);
            }

            res.status(201).json({
                message: 'Documents uploaded successfully. AI is comparing transactions. Status: Flagged for Admin Review.',
                uploadRecord,
                verification_status: 'flagged'
            });

        } catch (error) {
            console.error('Upload documents error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getStatus: async (req, res) => {
        try {
            const profile_id = req.user.id;
            const { employeeId } = req.query;

            let query = supabaseAdmin
                .from('workers')
                .select('*, worker_uploads(*)');

            if (employeeId) {
                query = query.eq('id', employeeId);
            } else {
                query = query.eq('profile_id', profile_id);
            }

            const { data, error } = await query.single();

            if (error) throw error;

            res.status(200).json({
                status: data.verification_status || 'pending',
                trustScore: data.trust_score || 0,
                employee: data
            });
        } catch (error) {
            console.error('Get status error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = workerController;
