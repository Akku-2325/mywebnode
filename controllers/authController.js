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

             req.session.userId = newUser._id
               res.redirect('/auth/2fa/setup'); //Перенаправляем на 2fa страницу!

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
              req.session.userId = user._id; // Important: Save the userId in the session
              req.session.twoFactorRequired = true; // Mark that 2FA is required
      
              return res.redirect('/auth/verify2FA'); // Redirect to verification page
            } else {
              // No 2FA, log in directly
              req.session.userId = user._id;
              req.session.user = {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
              };
              req.session.is2FAVerified = true; //set the flag as true, so we know this flag in the app!
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
        
            if (!userId) {
                return res.redirect('/auth/login'); // No user in session, redirect to login
            }
        
            try {
                const user = await User.findById(userId);
        
                if (!user) {
                    return res.render('login', { error: 'Invalid email.', twoFactorRequired: false });
                }
        
                if (!user.is2FAEnabled) {
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                    };
                    req.session.is2FAVerified = true;
                    delete req.session.twoFactorRequired; //clears the `twoFactorRequired`flag
                    return res.redirect('/');
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
              console.log("2fa1")
              if (!req.session.userId) {
                  console.log("2fa2")
                  return res.redirect('/auth/login');
              }
              console.log("2fa3")
              try {
                  console.log("2fa4")
                  const user = await User.findById(req.session.userId);
                  console.log("2fa5")
                  if (!user) {
                      console.log("2fa6")
                      return res.status(404).send('User not found');
                  }
                  console.log("2fa7")
                  // Generate a secret key for 2FA
                  const secret = speakeasy.generateSecret({ length: 20 });
                  console.log("2fa8")
                  // Generate QR code
                  qrcode.toDataURL(secret.otpauth_url, async (err, data_url) => {
                      console.log("2fa9")
                      if (err) {
                          console.log("2fa10")
                          console.error('Error generating QR code:', err);
                          return res.status(500).send('Error generating QR code');
                      }
                      console.log("2fa11")
                      // Update user in database
                      user.twoFASecret = secret.base32;
                      user.is2FAEnabled = true; // Enable 2FA
                      await user.save();
                      console.log("2fa12")
                      req.session.user = {
                          _id: user._id,
                          email: user.email,
                          username: user.username,
                          role: user.role,
                          twoFASecret: user.twoFASecret, // save for session as well
                          is2FAEnabled: user.is2FAEnabled,
                      };
                      console.log("2fa13")
                      res.render('2fa/setup', { qr_code: data_url, secret: secret.base32 });
                  });
              } catch (error) {
                  console.log("2fa14")
                  console.error('Error setting up 2FA:', error);
                  res.status(500).send('Error setting up 2FA');
              }
          }
      };
      
      module.exports = authController;