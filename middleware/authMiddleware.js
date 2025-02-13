const User = require('../models/User');

const authMiddleware = {
    isLoggedIn: (req, res, next) => {
        if (req.session.userId && req.session.is2FAVerified) {
            return next();
        } else {
            return res.redirect('/auth/login');
        }
    },

    isAdmin: async (req, res, next) => {
        if (req.session.user && req.session.user.role === 'admin') {
            return next();
        } else {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
    },

    setUser: async (req, res, next) => {
        if (req.session && req.session.userId) {
            try {
                const user = await User.findById(req.session.userId).lean();
                if (user) {
                    res.locals.user = {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        role: user.role
                    }; // Используем данные из базы данных
                }
            } catch (error) {
                console.error('Error fetching user for middleware:', error);
            }
        }
        next();
    }
};

module.exports = authMiddleware;