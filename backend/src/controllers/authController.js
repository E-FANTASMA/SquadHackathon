const { supabase, supabaseAdmin } = require('../config/supabase');

const authController = {
    // Company Signup
    companySignup: async (req, res) => {
        try {
            const { company_name, email, password, phone_number } = req.body;

            if (!company_name || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 1. Sign up user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            // 2. Create company record
            const { data: companyData, error: companyError } = await supabaseAdmin
                .from('companies')
                .insert([
                    { company_name, email, phone_number }
                ])
                .select()
                .single();

            if (companyError) throw companyError;

            // 3. Create user record in public.users
            const { error: userError } = await supabaseAdmin
                .from('users')
                .insert([
                    { 
                        id: userId, 
                        role: 'company_admin', 
                        company_id: companyData.id, 
                        email 
                    }
                ]);

            if (userError) throw userError;

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
            const { full_name, nin, email, password, phone_number } = req.body;

            if (!full_name || !nin || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 1. Sign up user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            // 2. Create user record in public.users
            const { error: userError } = await supabaseAdmin
                .from('users')
                .insert([
                    { 
                        id: userId, 
                        role: 'worker', 
                        email 
                    }
                ]);

            if (userError) throw userError;

            // 3. Create worker record
            const { data: workerData, error: workerError } = await supabaseAdmin
                .from('workers')
                .insert([
                    { 
                        user_id: userId, 
                        full_name, 
                        nin,
                        // account_number and bank_name might be added later during claim or profile update
                    }
                ])
                .select()
                .single();

            if (workerError) throw workerError;

            res.status(201).json({
                message: 'Worker registered successfully. Please check your email for verification.',
                user: authData.user,
                worker: workerData
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

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Fetch user profile from public.users to get the role
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

            res.status(200).json({
                message: 'Login successful',
                session: data.session,
                user: data.user,
                profile: profile
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({ error: error.message });
        }
    }
};

module.exports = authController;
