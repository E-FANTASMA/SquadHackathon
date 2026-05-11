const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch user profile from public.users
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*, companies(*)')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return res.status(401).json({ error: 'User profile not found' });
        }

        req.user = user;
        req.profile = profile;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.profile) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (roles.length && !roles.includes(req.profile.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
};

module.exports = { authMiddleware, authorize };
