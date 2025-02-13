const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Using controller
const { body, validationResult } = require('express-validator'); // Import validator
const authMiddleware = require('../middleware/authMiddleware');

// Registration Route
router.get('/register', authController.getRegister);

// Registration Route with Validation
router.post('/register', [
  body('email').isEmail().withMessage('Invalid email address'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], authController.postRegister);

// Login Route
router.get('/login', authController.getLogin);

// Login Route with Validation
router.post('/login', [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
], authController.postLogin);

// Logout Route
router.get('/logout', authController.getLogout);

// 2FA Setup Route
router.get('/2fa/setup', authMiddleware.isLoggedIn, authController.get2FASetup);

// 2FA Verification Routes
router.get('/verify2FA', authController.getVerify2FA);
router.post('/verify2FA', authController.postVerify2FA); // Process 2FA submission

module.exports = router;