const { supabaseAdmin } = require('../config/supabase');

const VirtualAccount = {
    create: async (data) => {
        const { data: virtualAccount, error } = await supabaseAdmin
            .from('virtual_accounts')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return virtualAccount;
    },

    getByMinistryId: async (ministryId) => {
        const { data, error } = await supabaseAdmin
            .from('virtual_accounts')
            .select('*')
            .eq('ministry_id', ministryId)
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = VirtualAccount;
