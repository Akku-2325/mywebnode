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
          //  return res.status(403).json({ message: 'Forbidden: Admin access required' }); // Original
          return res.status(403).render('error', { message: 'Forbidden: Admin access required' }); // Перенаправление на страницу error.ejs
      }
  },

    setUser: async (req, res, next) => {
        console.log('setUser middleware called'); // Debugging log
        if (req.session && req.session.userId) {
            console.log('req.session.userId:', req.session.userId); // Debugging log
            try {
                const user = await User.findById(req.session.userId).lean();
                if (user) {
                    res.locals.user = {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        role: user.role
                    }; // Используем данные из базы данных
                    console.log('User found:', res.locals.user); // Debugging log
                } else {
                    console.log('User not found in database'); // Debugging log
                    res.locals.user = null; // Ensure res.locals.user is null
                }
            } catch (error) {
                console.error('Error fetching user for middleware:', error);
                res.locals.user = null; // Ensure res.locals.user is null
            }
        } else {
            console.log('No user ID in session'); // Debugging log
            res.locals.user = null; // Ensure res.locals.user is null
        }
        next();
    }
};

module.exports = authMiddleware;