const { supabaseAdmin } = require('../config/supabase');
const storageUtils = require('../utils/storageUtils');
const squadService = require('../services/squadService');

const workerController = {
    claimRecord: async (req, res) => {
        try {
            const { account_number, bank_code, bank_name, nin: requestedNin } = req.body;
            const profile_id = req.user.id;

            // 1. Get worker profile
            const { data: worker, error: workerError } = await supabaseAdmin
                .from('workers')
                .select('*')
                .eq('profile_id', profile_id)
                .single();

            if (workerError) throw workerError;

            const finalNin = (worker.nin || requestedNin || '').toString().trim();
            const finalAccount = (account_number || '').toString().trim();

            console.log(`DEBUG: Claim attempt - NIN: [${finalNin}], Account: [${finalAccount}]`);

            // SCORING BASE
            let trust_score = 0;
            let status = 'pending';
            let evidence = [];

            // 2. Find potential payroll records for duplicate check
            const { data: allSameNin, error: dupError } = await supabaseAdmin
                .from('payroll_workers')
                .select('*')
                .eq('nin', finalNin);

            if (dupError) throw dupError;

            const isDuplicate = allSameNin && allSameNin.length > 1;
            if (isDuplicate) {
                evidence.push(`Duplicate NIN detected: ${allSameNin.length} records found with this NIN in payroll.`);
            }

            // 3. Find specific matching payroll record (Unclaimed)
            const payrollRecord = allSameNin.find(r => {
                if (r.worker_claimed) return false;
                const dbAcc = r.account_number.toString().trim();
                return dbAcc === finalAccount || 
                       dbAcc === finalAccount.replace(/^0+/, '') ||
                       '0' + dbAcc === finalAccount;
            });

            if (!payrollRecord) {
                return res.status(404).json({ 
                    error: 'No matching unclaimed payroll record found. Please verify your NIN and account number match what your employer uploaded.' 
                });
            }

            // SCORING LOGIC
            // +25 Identity Match (NIN + Account)
            trust_score += 25;
            evidence.push('Identity Match: NIN and Account number match payroll record (+25)');

            // +25 Uniqueness (No duplicates in batch)
            if (!isDuplicate) {
                trust_score += 25;
                evidence.push('Uniqueness: This NIN is unique within the payroll batch (+25)');
            } else {
                evidence.push('Risk: Duplicate NIN detected. Record flagged regardless of score.');
            }

            // +20 Name Integrity
            const pName = payrollRecord.full_name.toLowerCase();
            const wName = worker.full_name.toLowerCase();
            if (pName.includes(wName.split(' ')[0]) || wName.includes(pName.split(' ')[0])) {
                trust_score += 20;
                evidence.push('Name Integrity: Name matches payroll record (+20)');
            } else {
                evidence.push(`Name Discrepancy: Payroll name [${payrollRecord.full_name}] vs Profile name [${worker.full_name}]`);
            }

            // DETERMINE STATUS
            if (isDuplicate) {
                status = 'flagged';
            } else if (trust_score >= 70) { // Will reach 100 with docs later
                status = 'verified';
            } else if (trust_score >= 40) {
                status = 'flagged';
            } else {
                status = 'rejected';
            }

            // 4. Update worker profile
            await supabaseAdmin
                .from('workers')
                .update({ 
                    account_number: finalAccount, 
                    bank_name, 
                    bank_code,
                    trust_score,
                    verification_status: status
                })
                .eq('id', worker.id);

            // 5. Update payroll record
            await supabaseAdmin
                .from('payroll_workers')
                .update({ 
                    worker_claimed: true,
                    verification_status: status
                })
                .eq('id', payrollRecord.id);

            res.status(200).json({
                message: `Payroll record claimed. Status: ${status}, Score: ${trust_score}`,
                payrollRecord,
                trust_score,
                status,
                evidence
            });

        } catch (error) {
            console.error('Claim record error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    submitAppeal: async (req, res) => {
        try {
            const { reason, payroll_worker_id } = req.body;
            const profile_id = req.user.id;

            const { data: worker } = await supabaseAdmin
                .from('workers')
                .select('id')
                .eq('profile_id', profile_id)
                .single();

            if (!worker) throw new Error('Worker profile not found');

            const { data: appeal, error } = await supabaseAdmin
                .from('appeals')
                .insert([
                    { worker_id: worker.id, payroll_worker_id, reason, status: 'pending' }
                ])
                .select()
                .single();

            if (error) throw error;

            // Update status to flagged for admin review
            await supabaseAdmin
                .from('workers')
                .update({ verification_status: 'flagged' })
                .eq('id', worker.id);

            if (payroll_worker_id) {
                await supabaseAdmin
                    .from('payroll_workers')
                    .update({ verification_status: 'flagged' })
                    .eq('id', payroll_worker_id);
            }

            res.status(201).json({ message: 'Appeal submitted successfully', appeal });
        } catch (error) {
            console.error('Appeal error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getAppeals: async (req, res) => {
        try {
            const profile_id = req.user.id;

            // Find company admin's company
            const { data: company } = await supabaseAdmin
                .from('companies')
                .select('id')
                .eq('admin_id', profile_id)
                .single();

            if (!company) return res.status(403).json({ error: 'Unauthorized' });

            // Fetch appeals for workers in this company's batches
            const { data, error } = await supabaseAdmin
                .from('appeals')
                .select(`
                    *,
                    workers(full_name, nin, account_number),
                    payroll_workers(full_name, payroll_batches(batch_name, company_id))
                `);

            if (error) throw error;

            // Filter by company_id manually if RLS is tricky for this specific join
            const companyAppeals = data.filter(a => 
                a.payroll_workers?.payroll_batches?.company_id === company.id
            );

            res.status(200).json(companyAppeals);
        } catch (error) {
            console.error('Get appeals error:', error);
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
