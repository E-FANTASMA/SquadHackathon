const { supabase, supabaseAdmin } = require('../config/supabase');

const authController = {
    // Company Signup
    companySignup: async (req, res) => {
        try {
            const { companyName, company_name, email, password, phone_number, phone, firstName, lastName, first_name, last_name } = req.body;
            const final_company_name = companyName || company_name;
            const final_phone = phone_number || phone;
            const fName = firstName || first_name;
            const lName = lastName || last_name;

            if (!final_company_name || !email || !password || !fName || !lName) {
                return res.status(400).json({ error: 'Missing required fields (Company name, Email, Password, and Owner First/Last name)' });
            }

            const owner_full_name = `${fName.trim()} ${lName.trim()}`;

            // 1. Sign up user in Supabase Auth (Trigger handles profile creation)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: owner_full_name,
                        role: 'company_admin'
                    }
                }
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            // 2. Create company record
            const { data: companyData, error: companyError } = await supabaseAdmin
                .from('companies')
                .insert([
                    { admin_id: userId, company_name: final_company_name, phone_number: final_phone }
                ])
                .select()
                .single();

            if (companyError) throw companyError;

            res.status(201).json({
                message: 'Company registered successfully. Please check your email for verification.',
                user: authData.user,
                company: companyData
            });

        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Worker Signup
    workerSignup: async (req, res) => {
        try {
            const { firstName, lastName, first_name, last_name, nin, email, password } = req.body;
            const fName = firstName || first_name;
            const lName = lastName || last_name;

            if (!fName || !lName || !nin || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields (First name, Last name, NIN, Email, and Password)' });
            }

            const final_full_name = `${fName.trim()} ${lName.trim()}`;

            // ENFORCEMENT: Check if NIN exists in any payroll record
            const { data: payrollRecords, error: matchError } = await supabaseAdmin
                .from('payroll_workers')
                .select('id, full_name')
                .eq('nin', nin)
                .limit(1);

            if (matchError) throw matchError;

            if (!payrollRecords || payrollRecords.length === 0) {
                return res.status(403).json({ 
                    error: 'Access Denied: Your NIN is not registered in any authorized payroll. Please contact your employer.' 
                });
            }

            const payrollMatch = payrollRecords[0];

            // Optional: Loosely check name match
            const pName = payrollMatch.full_name.toLowerCase();
            const sName = final_full_name.toLowerCase();
            if (!pName.includes(sName.split(' ')[0]) && !sName.includes(pName.split(' ')[0])) {
                return res.status(403).json({ 
                    error: 'Access Denied: The name provided does not match the record associated with this NIN.' 
                });
            }

            // 1. Sign up user in Supabase Auth (Trigger handles profile creation)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: final_full_name,
                        role: 'worker'
                    }
                }
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            // 2. Create worker record (linked to profile)
            const { data: workerDataArr, error: workerError } = await supabaseAdmin
                .from('workers')
                .insert([
                    { 
                        profile_id: userId, 
                        full_name: final_full_name, 
                        nin 
                    }
                ])
                .select();

            if (workerError) throw workerError;

            res.status(201).json({
                message: 'Worker registered successfully. Please check your email for verification.',
                user: authData.user,
                worker: workerDataArr?.[0]
            });

        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Login (Universal)
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log(`DEBUG: Login attempt for email: ${email}`);

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error(`DEBUG: Supabase Auth error: ${error.message}`);
                throw error;
            }

            console.log(`DEBUG: Supabase Auth success for user: ${data.user.id}`);

            // Fetch user profile from public.profiles
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('*, companies(*), workers(*)')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profileError) {
                console.error(`DEBUG: Profile fetch error: ${profileError.message}`);
                // Don't throw here, maybe return what we have
            }

            if (!profile) {
                console.warn(`DEBUG: Profile not found for user ${data.user.id}. Is the DB trigger working?`);
            }

            res.status(200).json({
                message: 'Login successful',
                session: data.session,
                user: data.user,
                profile: profile || { role: 'unknown', full_name: 'Unknown User' }
            });

        } catch (error) {
            console.error('Login error:', error.message);
            res.status(401).json({ error: error.message });
        }
    }
};

module.exports = authController;
