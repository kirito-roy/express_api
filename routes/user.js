const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming middleware is in this path
const userController = require('../controllers/userController');

/**
 * @route   GET /api/details
 * @desc    Get current logged-in user's details
 * @access  Private
 */
router.get('/details', authMiddleware, userController.getUserDetails);

/**
 * @route   POST /api/updateDetails
 * @desc    Update user details
 * @access  Private
 */
router.post(
    '/updateDetails',
    [
        authMiddleware,
        // Optional validation for the fields.
        // They are optional, so they only run if the field is provided.
        check('username', 'Username must be a non-empty string').optional().isString().not().isEmpty(),
        check('profile_picture', 'Profile picture must be a valid URL').optional().isURL(),
        // This validates a broad range of international phone numbers
        check('phone_number', 'Please enter a valid phone number').optional({ checkFalsy: true }).isMobilePhone()
    ],
    userController.updateUserDetails
);

module.exports = router;
