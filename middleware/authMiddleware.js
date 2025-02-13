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
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      next();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
    setUser: async (req, res, next) => {
        if (req.session.userId) {
            try {
                const user = await User.findById(req.session.userId).lean();
                if (user) {
                    res.locals.user = user; // Make user available to all templates
                }
            } catch (error) {
                console.error('Error fetching user for middleware:', error);
            }
        }
        next();
    }
};

module.exports = authMiddleware;