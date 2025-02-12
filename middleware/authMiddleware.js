const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = {
    isLoggedIn: (req, res, next) => {
        if (req.session.userId) {
            next();
        } else {
            res.redirect('/auth/login');
        }
    },

    isAdmin: async (req, res, next) => {
        try {
            const user = await User.findById(req.session.userId);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden: Admin access required' });
            }
            next();
        } catch (error) {
            console.error("Error checking admin status:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = authMiddleware;