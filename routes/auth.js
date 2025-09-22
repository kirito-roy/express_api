const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    authController.loginUser
);

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/signup',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    authController.signupUser
);

/**
 * @route   POST /auth/google-login
 * @desc    Handle Google authenticated users
 * @access  Public
 */
router.post(
    '/google-login',
    [
        check('uid', 'Google UID is required').not().isEmpty(),
        check('displayName', 'Display name is required').not().isEmpty(),
        check('email', 'A valid email is required').isEmail(),
        check('photoURL', 'A photo URL is required').not().isEmpty(),
    ],
    authController.googleLogin
);

module.exports = router;