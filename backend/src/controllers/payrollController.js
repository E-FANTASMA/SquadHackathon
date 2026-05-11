const xlsx = require('xlsx');
const { supabaseAdmin } = require('../config/supabase');
const storageUtils = require('../utils/storageUtils');

const payrollController = {
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

            // 1. Parse Excel file
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            if (data.length === 0) {
                return res.status(400).json({ error: 'Excel file is empty' });
            }

            // Validate columns
            const requiredColumns = ['full_name', 'nin', 'account_number', 'salary_amount'];
            const firstRow = data[0];
            for (const col of requiredColumns) {
                if (!(col in firstRow)) {
                    return res.status(400).json({ error: `Missing required column: ${col}` });
                }
            }

            // 2. Upload file to Supabase Storage
            const fileName = `${company_id}/${Date.now()}_${req.file.originalname}`;
            await storageUtils.uploadFile('payroll_excels', fileName, req.file.buffer, req.file.mimetype);

            // 3. Create Payroll Batch
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

            // 4. Create Payroll Workers
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
    }
};

module.exports = payrollController;
