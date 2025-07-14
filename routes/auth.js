const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // Assuming this middleware is functional

//-------------------------------------------------------------
// POST /api/user/login - Authenticate user and get token
// Aligns with original function's input/output expectations
//-------------------------------------------------------------
router.post('/login', [
  // Validation checks for login
  check('email', "Missing 'email' or 'password' value for login").isEmail(), // Adjusted message to match original
  check('password', "Missing 'email' or 'password' value for login").exists(), // Adjusted message
],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Original function returned a single error string for missing fields.
      // express-validator provides an array. To match original, we'll take the first error message.
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists by email
      let user = await User.findOne({ email });
      if (!user) {
        // Aligned with original: Status 404 and 'error' key
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if the user has a password (for regular login, not Google)
      // This is important if you allow users without a bcrypt hashed password
      // (e.g., those created via Google login) to attempt direct login.
      // The original function did not have this, but it's a good safeguard.
      // I'll keep it as a more specific error than 'Invalid password'.
      if (!user.password || user.password === 'google-auth') {
        return res.status(400).json({ error: 'Please use Google Login for this account.' }); // Using 'error' key
      }

      // Compare entered password with hashed password in DB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Aligned with original: Status 401 and 'error' key
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Create and return JWT
      const payload = {
        user: {
          id: user.id,
          username: user.username, // Use username from the schema
          email: user.email,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET, // Ensure JWT_SECRET is set in your .env file
        { expiresIn: '7d' }, // Original code comment said 1 hour, but actual code was 7 days. Sticking to 7 days.
        (err, token) => {
          if (err) {
            console.error('❌ JWT signing error during login:', err);
            // Aligned with original: 'error' key and 'details'
            return res.status(500).json({ error: 'Internal Server Error', details: 'Token generation failed' });
          }

          // Aligned with original: Status 200, 'message', 'token', and 'user' object
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
    }
    catch (error) { // Changed 'err' to 'error' for consistency with original
      console.error('❌ Error during login:', error.stack); // Log stack for better debugging
      // Aligned with original: 'error' key and 'details'
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
);


//-------------------------------------------------------------
// POST /api/signup - Register a new user
//-------------------------------------------------------------
//-------------------------------------------------------------
// POST /api/user/signup - Register a new user
// Aligns with original function's input/output expectations
//-------------------------------------------------------------
router.post('/signup',
  [
    // Validation checks using express-validator
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Original function returned a simple error string for missing fields.
      // express-validator provides an array of errors, which is more informative.
      // We'll return it as 'errors' array, which is slightly different but standard for express-validator.
      // If strict adherence to single 'error' string is needed, you'd manually format.
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists (by email or username)
      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        // Aligned with original: Status 409 and 'error' key
        return res.status(409).json({ error: "User already exists with this email or username" });
      }

      // Create new user instance
      user = new User({
        username,
        email,
        password, // This will be hashed below
        role: 'user', // Default role as per original function
        created_at: new Date(), // Set created_at explicitly if not handled by default in schema
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to the database
      await user.save();

      // Prepare JWT payload
      const payload = {
        user: {
          id: user.id, // Mongoose uses .id for the _id field
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };

      // Generate JWT token
      jwt.sign(
        payload,
        process.env.JWT_SECRET, // Ensure JWT_SECRET is set in your .env file
        { expiresIn: '7d' }, // Original code comment said 1 hour, but actual code was 7 days. Sticking to 7 days.
        (err, token) => {
          if (err) {
            console.error('❌ JWT signing error during signup:', err);
            // Aligned with original: 'error' key and details
            return res.status(500).json({ error: 'Internal Server Error', details: 'Token generation failed' });
          }

          // Aligned with original: Status 201, 'message', 'token', and 'user' object
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

    } catch (error) { // Changed 'err' to 'error' for consistency with original
      console.error('❌ Error during signup:', error.stack); // Log stack for better debugging
      // Aligned with original: 'error' key and 'details'
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
);

//-------------------------------------------------------------
// POST /api/user/google-login - Handle Google authenticated users
// Aligns with original function's input/output expectations
//-------------------------------------------------------------
router.post('/google-login', [
  // Validate incoming fields based on the original function's expected inputs
  check('uid', 'Missing required field: uid').not().isEmpty(),
  check('displayName', 'Missing required field: displayName').not().isEmpty(),
  // REMOVED createdAt check from express-validator as it's often unreliable from client or handled by backend
  check('email', 'Missing required field: email or invalid email').isEmail(),
  check('emailVerified', 'Missing required field: emailVerified').isBoolean(), // Ensure it's a boolean
  check('photoURL', 'Missing required field: photoURL').not().isEmpty(),
], async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  // Destructure all expected fields from the original function
  const { uid, displayName, /* Removed createdAt here if not strictly needed from frontend */ email, emailVerified, photoURL } = req.body;

  try {
    let user = await User.findOne({ email });
    let responseUser = {};
    let message = '';

    if (user) {
      user.last_login = Date.now();
      if (user.username !== displayName) user.username = displayName;
      if (user.profile_picture !== photoURL) user.profile_picture = photoURL;
      await user.save();

      responseUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      message = 'Login successful';
    } else {
      // 2b. If user does not exist: Create a new user
      user = new User({
        username: displayName,
        email,
        password: uid, // Use uid as a placeholder password
        role: 'user',
        // FIX: Remove or conditionally set created_at.
        // Option 1: Remove if your Mongoose schema has `created_at: { type: Date, default: Date.now }`
        //          (This is the **recommended** approach for cleaner code)
        // created_at: new Date(createdAt), // <-- REMOVE THIS LINE ENTIRELY
        // Option 2: Safely set it if frontend `createdAt` is truly necessary but might be invalid
        created_at: req.body.createdAt && !isNaN(new Date(req.body.createdAt)) ? new Date(req.body.createdAt) : new Date(),
        profile_picture: photoURL,
        last_login: Date.now(),
      });

      await user.save();

      responseUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      message = 'Login successful';
    }

    const payload = {
      user: {
        id: responseUser.id,
        username: responseUser.username,
        email: responseUser.email,
        role: responseUser.role,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: message,
      token,
      user: responseUser,
    });

  } catch (error) {
    console.error('❌ Error during Google login:', error.stack);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'A user with this email or username already exists.' });
    }
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;