const { supabaseAdmin } = require('../config/supabase');
const squadService = require('../services/squadService');

const paymentController = {
    // Company funds their wallet/batch
    fundBatch: async (req, res) => {
        try {
            const { batchId } = req.body;
            const company_id = req.profile.company_id;

            // Get batch details
            const { data: batch, error: batchError } = await supabaseAdmin
                .from('payroll_batches')
                .select('*')
                .eq('id', batchId)
                .eq('company_id', company_id)
                .single();

            if (batchError || !batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const reference = `FUND_${batchId}_${Date.now()}`;
            
            // Initiate payment with Squad
            const squadResponse = await squadService.initiatePayment(
                batch.total_amount,
                req.profile.email,
                reference,
                { batch_id: batchId, company_id }
            );

            res.status(200).json({
                message: 'Payment initiated',
                checkout_url: squadResponse.data.checkout_url,
                reference
            });

        } catch (error) {
            console.error('Fund batch error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Trigger salary disbursement for verified workers in a batch
    disburseSalaries: async (req, res) => {
        try {
            const { batchId } = req.body;
            const company_id = req.profile.company_id;

            // 1. Check if batch is funded
            const { data: batch, error: batchError } = await supabaseAdmin
                .from('payroll_batches')
                .select('*')
                .eq('id', batchId)
                .eq('company_id', company_id)
                .single();

            if (batchError || !batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            if (batch.status !== 'funded') {
                return res.status(400).json({ error: 'Batch must be funded before disbursement' });
            }

            // 2. Get verified workers in this batch who have claimed their record
            const { data: eligibleWorkers, error: workersError } = await supabaseAdmin
                .from('payroll_workers')
                .select('*, workers!inner(*)')
                .eq('payroll_batch_id', batchId)
                .eq('worker_claimed', true)
                .eq('verification_status', 'verified');

            if (workersError) throw workersError;

            if (!eligibleWorkers.length) {
                return res.status(400).json({ error: 'No verified workers found in this batch' });
            }

            const results = [];

            // 3. Process disbursement for each worker (In production, use a queue or batch payout)
            for (const record of eligibleWorkers) {
                const reference = `PAY_${record.id}_${Date.now()}`;
                
                try {
                    // This is a placeholder for actual disbursement logic
                    // You might need bank codes for Squad
                    // For now, we'll just record the payment attempt
                    
                    const paymentData = {
                        worker_id: record.workers.id,
                        payroll_batch_id: batchId,
                        amount: record.salary_amount,
                        transfer_reference: reference,
                        payment_status: 'processing'
                    };

                    const { data: paymentRecord, error: payError } = await supabaseAdmin
                        .from('payments')
                        .insert([paymentData])
                        .select()
                        .single();

                    if (payError) throw payError;

                    // Trigger Squad Payout (Commented out until real bank codes are available)
                    /*
                    const payout = await squadService.disburseFunds(
                        record.salary_amount,
                        record.workers.bank_code, 
                        record.workers.account_number,
                        record.workers.full_name,
                        reference
                    );
                    */

                    results.push({ worker: record.full_name, status: 'initiated', reference });
                } catch (err) {
                    console.error(`Failed to pay ${record.full_name}:`, err.message);
                    results.push({ worker: record.full_name, status: 'failed', error: err.message });
                }
            }

            res.status(200).json({
                message: 'Disbursement process completed',
                results
            });

        } catch (error) {
            console.error('Disbursement error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Squad Webhook Handler
    handleWebhook: async (req, res) => {
        try {
            // Validate Squad signature here in production
            const payload = req.body;
            const event = payload.event;

            // Log webhook
            await supabaseAdmin.from('payment_webhooks').insert([
                { event_type: event, payload, processed: false }
            ]);

            if (event === 'charge.success') {
                const { batch_id } = payload.metadata;
                
                // Update batch status to funded
                await supabaseAdmin
                    .from('payroll_batches')
                    .update({ status: 'funded' })
                    .eq('id', batch_id);
            }

            if (event === 'transfer.success') {
                const reference = payload.transaction_reference;
                
                // Update payment status to success
                await supabaseAdmin
                    .from('payments')
                    .update({ payment_status: 'success' })
                    .eq('transfer_reference', reference);
            }

            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch Squad Merchant Balance
    getSquadBalance: async (req, res) => {
        try {
            const balanceData = await squadService.getMerchantBalance();
            res.status(200).json(balanceData);
        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = paymentController;
