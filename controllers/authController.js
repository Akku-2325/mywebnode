const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

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

            // После успешной регистрации, сразу перенаправляем на страницу настройки 2FA
            req.session.userId = newUser._id; // Сохраняем userId в сессии
            return res.redirect('/auth/2fa/setup');

        } catch (error) {
            console.error('Error registering user:', error);
            res.render('register', { error: 'An error occurred during registration.' });
        }
    },

    getLogin: async (req, res) => {
        res.render('login', {twoFactorRequired: false});
    },

    postLogin: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login', { error: errors.array()[0].msg, twoFactorRequired: false });
        }
        const { email, password, twoFactorCode } = req.body;
    
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.render('login', { error: 'Invalid email.', twoFactorRequired: false });
            }
    
            if (user.lockUntil && user.lockUntil > Date.now()) {
                const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
                return res.render('login', { error: `Account locked. Try again in ${timeRemaining} minutes.`, twoFactorRequired: false });
            }
    
            const isPasswordValid = await user.isValidPassword(password);
    
            if (!isPasswordValid) {
                user.loginAttempts += 1;
                if (user.loginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                }
                await user.save();
                return res.render('login', { error: 'Invalid password.', twoFactorRequired: false });
            }
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();
    
            // *** Обработка 2FA ***
            if (user.is2FAEnabled) {
                if (!twoFactorCode) {
                    // ***ВАЖНО***: Здесь передаем twoFactorRequired: true и *ОСТАНАВЛИВАЕМ выполнение функции*
                    return res.render('login', { error: 'Two-factor code is required', twoFactorRequired: true });
                }
    
                const verified = speakeasy.totp.verify({
                    secret: user.twoFASecret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 2
                });
    
                if (!verified) {
                    return res.render('login', { error: 'Invalid two-factor code', twoFactorRequired: true });
                }
    
                // 2FA verification successful
                req.session.userId = user._id;
                req.session.user = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    is2FAVerified: true
                };
                console.log("User logged in with 2FA:", req.session.user);
                return res.redirect('/'); // ***ВАЖНО***: ОСТАНАВЛИВАЕМ выполнение функции
            } else {
                // *** Обработка обычного логина (без 2FA) ***
                req.session.userId = user._id;
                req.session.user = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    is2FAVerified: true // No 2FA, so consider verified
                };
                console.log("User logged in with no 2FA:", req.session.user);
                return res.redirect('/'); // ***ВАЖНО***: ОСТАНАВЛИВАЕМ выполнение функции
            }
    
        } catch (error) {
            console.error('Error logging in:', error);
            res.render('login', { error: 'An error occurred during login.', twoFactorRequired: false });
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
    },

   get2FASetup: async (req, res) => {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
             // Check if the user already has a 2FA secret
            if (user.twoFASecret) {
                return res.render('2fa/setup', { qr_code: null, secret: user.twoFASecret, message: '2FA is already set up for your account.' });
            }
            // Generate a secret key for 2FA
            const secret = speakeasy.generateSecret({ length: 20 });
             // Generate QR code
            qrcode.toDataURL(secret.otpauth_url, async (err, data_url) => {
                if (err) {
                    console.error('Error generating QR code:', err);
                    return res.status(500).send('Error generating QR code');
                }
                // Update user in database
                user.twoFASecret = secret.base32;
                user.is2FAEnabled = true;
                await user.save();
                // Update session
                req.session.user = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    twoFASecret: user.twoFASecret, // save for session as well
                    is2FAEnabled: user.is2FAEnabled,
                     is2FAVerified: true // Save for session as well
                };
                console.log('2FA setup for user:', req.session.user);
                 res.render('2fa/setup', { qr_code: data_url, secret: secret.base32 });
            });
        } catch (error) {
            console.error('Error setting up 2FA:', error);
            res.status(500).send('Error setting up 2FA');
        }
    },
    getVerify2FA: async (req, res) => {
        try {
            // Here, you would typically fetch the user and check if 2FA is enabled
            // You might also want to pass user-specific data to the view
            res.render('verify2FA'); // Render the 2FA verification form
        } catch (error) {
            console.error('Error fetching 2FA setup:', error);
            res.render('login', { error: 'Error displaying 2FA setup.' });
        }
    },
};

module.exports = authController;