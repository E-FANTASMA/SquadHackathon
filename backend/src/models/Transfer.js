const { supabaseAdmin } = require('../config/supabase');

const Transfer = {
    create: async (data) => {
        const { data: transfer, error } = await supabaseAdmin
            .from('transfers')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return transfer;
    },

    update: async (reference, updateData) => {
        const { data: transfer, error } = await supabaseAdmin
            .from('transfers')
            .update(updateData)
            .eq('transfer_reference', reference)
            .select()
            .single();

        if (error) throw error;
        return transfer;
    },

    getByReference: async (reference) => {
        const { data, error } = await supabaseAdmin
            .from('transfers')
            .select('*')
            .eq('transfer_reference', reference)
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = Transfer;
