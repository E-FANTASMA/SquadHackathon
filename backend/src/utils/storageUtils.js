const { supabaseAdmin } = require('../config/supabase');

const storageUtils = {
    uploadFile: async (bucket, path, fileBuffer, contentType) => {
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, fileBuffer, {
                contentType,
                upsert: true
            });

        if (error) throw error;
        return data;
    },

    getPublicUrl: (bucket, path) => {
        const { data } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};

module.exports = storageUtils;
