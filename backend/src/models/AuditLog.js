const { supabaseAdmin } = require('../config/supabase');

const AuditLog = {
    log: async (eventType, description, actorId, metadata = {}) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('audit_logs')
                .insert([{
                    event_type: eventType,
                    description,
                    actor_id: actorId,
                    metadata
                }]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Audit Log Error:', error.message);
            // We don't necessarily want to throw here to avoid breaking the main flow
            // if audit logging fails, but in a fintech app, it might be mandatory.
        }
    }
};

module.exports = AuditLog;
