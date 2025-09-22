const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Get current user's details
 * @route   GET /api/details
 * @access  Private
 */
exports.getUserDetails = async (req, res) => {
    try {
        // req.user.id is set by the authMiddleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({result:user,message: 'User details fetched successfully'});
    } catch (error) {
        console.error('❌ Error fetching user details:', error.stack);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

/**
 * @desc    Update user details
 * @route   POST /api/updateDetails
 * @access  Private
 */
exports.updateUserDetails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Fields that are allowed to be updated
    const { username, profile_picture, phone_number } = req.body;

    // Build user object from the request body
    const userFields = {};
    if (username) userFields.username = username;
    if (profile_picture) userFields.profile_picture = profile_picture;
    if (phone_number) userFields.phone_number = phone_number;
    userFields.updated_at = Date.now();

    try {
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if new username is already taken by another user
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ error: 'Username is already taken' });
            }
        }

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true } // Return the modified document
        ).select('-password'); // Exclude password from the result

        res.json({
            message: 'User details updated successfully',
            user
        });

    } catch (error) {
        console.error('❌ Error updating user details:', error.stack);
        // Handle potential duplicate key error for username if not caught above
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Username is already taken' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
