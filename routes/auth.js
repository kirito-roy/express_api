const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authController');
const { check } = require('express-validator');

const auth = require('../middleware/authMiddleware');


router.post('/login', [
  // Validation checks for login
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
],
  authcontroller.login
);


// 📋 [GET] List all students
router.post('/signup',
  [
    // Validation checks
    check('name', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  authcontroller.signup
);
router.post("/google-login", authcontroller.googleLogin);
router.post("/forgot-password", authcontroller.forgotPassword);
router.post("/verify-otp", authcontroller.verifyOtp);

// @route   POST /api/auth/upload-profile-picture
// @desc    Upload a user profile picture
// @access  Private
router.post('/upload-profile-picture', auth, authcontroller.uploadProfilePicture);

// @route   PUT /api/auth/update-profile
// @desc    Update user name and email
// @access  Private
router.put(
  '/update-profile',
  auth,
  [
    check('name', 'Name cannot be empty').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
  ],
  authcontroller.updateProfile
);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's data
// @access  Private
router.get('/me', auth, authcontroller.getCurrentUser);

// @route   GET /api/auth/user/:id
// @desc    Get user by ID
// @access  Public
router.get('/user/:id', authcontroller.getUserById);

// router.post("/forgot-password", authcontroller.forgotPassword);
router.post("/reset-password", authcontroller.resetPassword);

module.exports = router;