const mongoose = require('mongoose');
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
            await newUser.save(); // Сохраняем пользователя

            req.session.userId = newUser._id;
            res.redirect('/auth/2fa/setup'); //Перенаправляем на 2fa страницу!

        } catch (error) {
            console.error('Error registering user:', error);
            res.render('register', { error: 'An error occurred during registration.' });
        }
    },

    getLogin: async (req, res) => {
        res.render('login', { twoFactorRequired: false });
    },

    postLogin: async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.render('login', { error: errors.array()[0].msg });
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
  
          // 2FA Logic
          if (user.is2FAEnabled) {
              // Redirect to 2FA verification page if not yet verified
              req.session.userId = user._id;
              req.session.twoFactorRequired = true;
              return res.redirect('/auth/verify2FA');
          } else {
              // No 2FA, log in directly
              // Store user information in session
              req.session.userId = user._id;
              req.session.user = {
                  _id: user._id,
                  email: user.email,
                  username: user.username,
                  role: user.role,
              };
              console.log('User role after login:', req.session.user.role); // Debugging log
              req.session.is2FAVerified = true;
              console.log('User logged in:', req.session.user);
              return res.redirect('/');
          }
  
      } catch (error) {
          console.error('Error logging in:', error);
          res.render('login', { error: 'An error occurred during login.', twoFactorRequired: false });
      }
  },

    // New function to handle 2FA verification
    postVerify2FA: async (req, res) => {
        const { twoFactorCode } = req.body;
        const userId = req.session.userId; // Get userId from session

        if (!req.session.twoFactorRequired) {
            return res.redirect('/'); // Или куда-нибудь еще, где требуется 2FA
        }


        if (!userId) {
            return res.redirect('/auth/login'); // No user in session, redirect to login
        }

        try {
            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/auth/login');
            }

            if (!twoFactorCode) {
                return res.render('verify2FA', { error: 'Two-factor code is required' });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 2,
            });

            if (verified) {
                // 2FA code is valid

                // Set session variables
                req.session.user = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                };
                req.session.is2FAVerified = true; // Mark 2FA as verified
                delete req.session.twoFactorRequired; // Remove the flag

                return res.redirect('/'); // Redirect to the main page
            } else {
                // 2FA code is invalid
                return res.render('verify2FA', { error: 'Invalid two-factor code' });
            }
        } catch (error) {
            console.error('Error verifying 2FA:', error);
            res.render('verify2FA', { error: 'An error occurred during 2FA verification.' });
        }
    },

    getVerify2FA: async (req, res) => {
        if (!req.session.userId || !req.session.twoFactorRequired) {
            return res.redirect('/auth/login'); // If no user ID in session, redirect to login
        }
        try {
            // Here, you would typically fetch the user and check if 2FA is enabled
            // You might also want to pass user-specific data to the view
            res.render('verify2FA'); // Render the 2FA verification form
        } catch (error) {
            console.error('Error fetching 2FA setup:', error);
            res.render('login', { error: 'Error displaying 2FA setup.' });
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
        console.log("get2FASetup called");
        if (!req.session.userId) {
            console.log("get2FASetup: no user ID in session");
            return res.redirect('/auth/login');
        }
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                console.log("get2FASetup: user not found");
                return res.status(404).send('User not found');
            }
            // Generate a secret key for 2FA
            console.log("get2FASetup: generating secret key");
            const secret = speakeasy.generateSecret({ length: 20 });
            console.log("get2FASetup: secret key generated", secret.base32);

            const otpAuthURL = speakeasy.otpauthURL({
                secret: secret.base32,
                label: `YourAppName (${user.email})`, // Или username
                encoding: 'base32',
            });
            console.log("get2FASetup: otpAuthURL generated", otpAuthURL);

            // Generate QR code
            qrcode.toDataURL(otpAuthURL, async (err, data_url) => {
                if (err) {
                    console.error('get2FASetup: Error generating QR code:', err);
                    return res.status(500).send('Error generating QR code');
                }

                const saltRounds = 10;
                console.log("get2FASetup: hashing secret key");
                bcrypt.hash(secret.base32, saltRounds, async (err, hash) => {
                    if (err) {
                        console.error('get2FASetup: Error hashing secret:', err);
                        return res.status(500).send('Error setting up 2FA');
                    }
                    console.log("get2FASetup: secret key hashed", hash);

                    user.twoFASecret = hash;
                    user.is2FAEnabled = true;
                    console.log("get2FASetup: saving user");
                    await user.save();
                    console.log("get2FASetup: user saved");

                    res.render('2fa/setup', { qr_code: data_url, secret: secret.base32 });
                });
            });
        } catch (error) {
            console.error('get2FASetup: Error setting up 2FA:', error);
            res.status(500).send('Error setting up 2FA');
        }
    },

    postVerify2FA: async (req, res) => {
        console.log("postVerify2FA called");

        if (!req.session.twoFactorRequired) {
            console.log("postVerify2FA: 2FA not required, redirecting");
            return res.redirect('/'); // Или куда-нибудь еще, где требуется 2FA
        }

        const { twoFactorCode } = req.body;
        const userId = req.session.userId; // Get userId from session
        console.log("postVerify2FA: userId from session", userId);


        if (!userId) {
            console.log("postVerify2FA: no user ID in session, redirecting to login");
            return res.redirect('/auth/login'); // No user in session, redirect to login
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log("postVerify2FA: user not found");
                return res.redirect('/auth/login');
            }
            console.log("postVerify2FA: user found", user.email);

            if (!twoFactorCode) {
                console.log("postVerify2FA: no 2FA code provided");
                return res.render('verify2FA', { error: 'Two-factor code is required' });
            }

            console.log("postVerify2FA: comparing codes");
            bcrypt.compare(twoFactorCode, user.twoFASecret, async (err, valid) => {
                if (err) {
                    console.error('postVerify2FA: bcrypt compare error:', err);
                    return res.render('verify2FA', { error: 'Error verifying 2FA' });
                }
                console.log("postVerify2FA: bcrypt compare result:", valid);

                if (valid) {
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                    };
                    req.session.is2FAVerified = true; // Mark 2FA as verified
                    delete req.session.twoFactorRequired; // Remove the flag
                    console.log("postVerify2FA: 2FA verified, redirecting to home");
                    return res.redirect('/'); // Redirect to the main page
                } else {
                    console.log("postVerify2FA: invalid two-factor code");
                    return res.render('verify2FA', { error: 'Invalid two-factor code' });
                }
            });

        } catch (error) {
            console.error('postVerify2FA: Error verifying 2FA:', error);
            res.render('verify2FA', { error: 'An error occurred during 2FA verification.' });
        }
    },
};

module.exports = authController;