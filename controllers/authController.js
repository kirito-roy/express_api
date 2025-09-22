const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @desc    Authenticate user and get token
 * @route   POST /auth/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If password is not a bcrypt hash, it's likely a Google-authenticated user.
        // Bcrypt hashes start with $2a$, $2b$, or $2y$.
        if (user.password && !user.password.startsWith('$2')) {
            return res.status(400).json({ error: 'Please use Google Login for this account.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT signing error during login:', err);
                    return res.status(500).json({ error: 'Internal Server Error', details: 'Token generation failed' });
                }

                res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    },
                });
            }
        );
    } catch (error) {
        console.error('❌ Error during login:', error.stack);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

/**
 * @desc    Register a new user
 * @route   POST /auth/signup
 * @access  Public
 */
exports.signupUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(409).json({ error: "User already exists with this email or username" });
        }

        user = new User({
            username,
            email,
            password,
            role: 'user',
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT signing error during signup:', err);
                    return res.status(500).json({ error: 'Internal Server Error', details: 'Token generation failed' });
                }

                res.status(201).json({
                    message: "User registered successfully",
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    },
                });
            }
        );

    } catch (error) {
        console.error('❌ Error during signup:', error.stack);
        if (error.code === 11000) { // Handle duplicate key error from MongoDB
            return res.status(409).json({ error: 'User already exists with this email or username' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

/**
 * @desc    Handle Google authenticated users
 * @route   POST /auth/google-login
 * @access  Public
 */
exports.googleLogin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { uid, displayName, email, photoURL } = req.body;

    try {
        let user = await User.findOne({ email });
        let message = 'Login successful';

        if (user) {
            // User exists, update their info if needed
            user.last_login = new Date();
            if (user.username !== displayName) user.username = displayName;
            if (user.profile_picture !== photoURL) user.profile_picture = photoURL;
            await user.save();
        } else {
            // If user does not exist, create a new one
            user = new User({
                username: displayName,
                email,
                password: uid, // Use uid as a non-loginable placeholder password
                role: 'user',
                profile_picture: photoURL,
                last_login: new Date(),
            });
            await user.save();
            message = 'User registered and logged in successfully';
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message,
            token,
            user: payload.user,
        });

    } catch (error) {
        console.error('❌ Error during Google login:', error.stack);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A user with this email or username already exists.' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};