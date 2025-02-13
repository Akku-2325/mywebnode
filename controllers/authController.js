const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const authController = {
    getRegister: (req, res) => {
        res.render('register');
    },

    postRegister: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('register', { error: errors.array()[0].msg });
        }

        const { email, password, username } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.render('register', { error: 'Email already registered.' });
            }

            const newUser = new User({ email, password, username });
            await newUser.save();

            console.log('New user registered:', newUser);

            res.redirect('/auth/login');
        } catch (error) {
            console.error('Error registering user:', error);
            res.render('register', { error: 'An error occurred during registration.' });
        }
    },

    getLogin: (req, res) => {
        res.render('login');
    },

    postLogin: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login', { error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.render('login', { error: 'Invalid email.' });
            }

            if (user.lockUntil && user.lockUntil > Date.now()) {
                const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
                return res.render('login', { error: `Account locked. Try again in ${timeRemaining} minutes.` });
            }

            const isPasswordValid = await user.isValidPassword(password);

            if (!isPasswordValid) {
                user.loginAttempts += 1;
                if (user.loginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                }
                await user.save();
                return res.render('login', { error: 'Invalid password.' });
            }

            user.loginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();

            req.session.userId = user._id;
            req.session.user = {
                _id: user._id,
                email: user.email,
                username: user.username,
            };

            console.log('User logged in:', req.session.user);

            res.redirect('/');
        } catch (error) {
            console.error('Error logging in:', error);
            res.render('login', { error: 'An error occurred during login.' });
        }
    },

    getLogout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.redirect('/');
            }
            res.redirect('/auth/login');
        });
    }
};

module.exports = authController;