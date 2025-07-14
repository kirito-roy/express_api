const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // Assuming this middleware is functional

//-------------------------------------------------------------
// POST /api/login - Authenticate user and get token
//-------------------------------------------------------------
router.post('/login', [
  // Validation checks for login
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists by email
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Check if the user has a password (for regular login, not Google)
      // This is important if you allow users without a bcrypt hashed password
      // (e.g., those created via Google login) to attempt direct login.
      if (!user.password || user.password === 'google-auth') { // Check for placeholder
        return res.status(400).json({ msg: 'Please use Google Login for this account.' });
      }


      // Compare entered password with hashed password in DB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
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
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) {
            console.error('❌ JWT signing error during login:', err);
            return res.status(500).json({ msg: 'Server error: Token generation failed' });
          }
          res.json({ token, msg: 'Logged in successfully!' });
        }
      );
    }
    catch (err) {
      console.error('❌ Error during login:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

//-------------------------------------------------------------
// POST /api/signup - Register a new user
//-------------------------------------------------------------
router.post('/signup',
  [
    // Validation checks
    check('username', 'Username is required').not().isEmpty(), // Changed 'name' to 'username'
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body; // Changed 'name' to 'username'

    try {
      // Check if user already exists (by email or username)
      let user = await User.findOne({ $or: [{ email }, { username }] }); // Changed 'name' to 'username'
      if (user) {
        return res.status(400).json({ warning: 'User with that email or username already exists' });
      }

      // Create new user instance
      user = new User({
        username, // Use username
        email,
        password, // Password will be hashed below
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to the database
      await user.save();

      // Create and return JWT
      const payload = {
        user: {
          id: user.id,
          username: user.username, // Use username
          email: user.email,
          role: "user", // Default role for new users
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) {
            console.error('❌ JWT signing error during signup:', err);
            return res.status(500).json({ error: 'Server error: Token generation failed' });
          }
          res.json({ token, msg: 'User registered successfully!' });
        }
      );

    } catch (err) {
      console.error('❌ Error during signup:', err.message);
      res.status(500).send('Server Error');
    }
  });

//-------------------------------------------------------------
// POST /api/google-login - Handle Google authenticated users
//-------------------------------------------------------------
router.post("/google-login", [
  check('email', 'A valid email is required for Google login').isEmail(),
  check('username', 'Username is required for Google login').not().isEmpty(), // Assuming Google provides a name that maps to username
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, username } = req.body; // Changed 'name' to 'username'

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update last_login and issue a new token
      user.last_login = Date.now();
      await user.save(); // Save the updated last_login time

      const payload = {
        user: {
          id: user.id,
          username: user.username, // Use username
          email: user.email,
          role: user.role,
        },
      };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, msg: 'Logged in successfully!' });
    }

    // If user does not exist, create a new user
    user = new User({
      username, // Use username
      email,
      password: '', // Set password to an empty string for Google-only users
      role: 'user', // Default role for new users
      last_login: Date.now(),
      // token_version will default to 1
    });

    await user.save();

    // Create JWT for the new user
    const payload = {
      user: {
        id: user.id,
        username: user.username, // Use username
        email: user.email,
        role: user.role,
      },
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, msg: 'User registered and logged in successfully!' });

  } catch (err) {
    console.error('❌ Error during Google login:', err);
    // More detailed error logging for debugging
    if (err.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ msg: 'A user with this email or username already exists.' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;