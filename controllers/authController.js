const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator'); // For input validation
const User = require('../models/User');
const nodemailer = require('nodemailer');
const LoginActivity = require('../models/LoginActivity');
const OTP = require('../models/otp'); // Import OTP model


// ...existing code...
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL, // Your Gmail address (e.g., 'your_email@gmail.com')
        pass: process.env.GMAIL_PASSWORD // The generated App Password
    }
});


exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' }); // Use generic message for security
        }

        // Check if the user is suspended
        if (user.suspended) {
            return res.status(403).json({ msg: 'Your account has been suspended.', suspended: true });
        }

        // Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Log the successful login activity
        const loginActivity = new LoginActivity({ user: user.id });
        await loginActivity.save();

        // Create and return JWT
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
        // Update last login time without running full document validation
        await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }, // Token expires in 7 days (1 week)
            (err, token) => {
                if (err) throw err;
                res.json({ token, msg: 'Logged in successfully!' });
            }
        );
    }
    catch (err) {
        console.error('❌ Error during login:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;


    try {
        // Check if user already exists (by email or username)
        let user = await User.findOne({ $or: [{ email }, { name }] });
        if (user && user.isActive == true) {
            return res.status(400).json({ warning: 'User with that email or username already exists' });
        }

        if (!user) {
            // Create new user instance
            user = new User({
                name,
                email,
                password, // Password will be hashed below
                lastLogin: new Date(), // Set last login time
                isActive: false, // Default to active
            });

            // Hash password
            const salt = await bcrypt.genSalt(10); // Generate a salt
            user.password = await bcrypt.hash(password, salt); // Hash the password with the salt

            // Save user to the database
            await user.save();
        }
        else {
            // If user exists but is not active, update the existing user
            user.name = name;
            user.email = email;
            user.password = await bcrypt.hash(password, await bcrypt.genSalt(10)); // Hash the new password
            user.lastLogin = new Date(); // Update last login time
            user.isActive = false; // Set to inactive
            await user.save();
        }
        // // Create and return JWT
        // const payload = {
        //     user: {
        //         id: user.id,
        //         name: user.name,
        //         email: user.email,
        //         role: "user", // Include role in the payload
        //     },
        // };
        // try {
        //     const token = jwt.sign(
        //         payload,
        //         process.env.JWT_SECRET,
        //         { expiresIn: '1d' }
        //     );
        //     res.json({ token, msg: 'User registered successfully!' });
        // } catch (err) {
        //     console.error('❌ Error during signup:', err);
        //     res.status(500).json({ error: 'JWT signing failed' });
        // }
        // Generate OTP (One Time Password)
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        // Save OTP to the database
        const otpEntry = new OTP({
            email,
            otp,
        });
        await otpEntry.save();
        // Send OTP via email
        try {
            // Define email options
            const mailOptions = {
                from: process.env.GMAIL, // Sender address (must be your Gmail address)
                to: email, // Recipient email address
                subject: "Registration Otp", // Subject line
                text: "text", // Plain text body
                html: `<h1>Registration Otp</h1><p>Your OTP is: <strong>${otp}</strong></p>` // HTML body (optional, can be used instead of or in addition to text)
            };
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            // You can log the preview URL for testing emails in development if you're not sending to a real address
            // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.status(200).json({ success: true, message: 'Email sent successfully!', messageId: info.messageId, });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (email && otp) {
            const otpEntry = await OTP.findOne({ email, otp });
            if (!otpEntry) {
                res.status(400).json({ warning: 'Invalid OTP' });
            }
            else {
                if (otpEntry.createdAt.getTime() + 5 * 60 * 1000 < new Date().getTime()) {
                    res.status(400).json({ warning: 'OTP has expired' });
                } else {
                    const user = await User.findOne({ email });
                    if (user) {
                        // Update user to be active without validating the whole document
                        await User.updateOne({ _id: user._id }, { $set: { isActive: true } });
                        await otpEntry.deleteOne();
                        const payload = {
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                            },
                        };
                        try {
                            const token = jwt.sign(
                                payload,
                                process.env.JWT_SECRET,
                                { expiresIn: '1d' }
                            );
                            res.json({ token, msg: 'User registered successfully!' });
                        } catch (err) {
                            console.error('❌ Error during signup:', err);
                            res.status(500).json({ error: 'JWT signing failed' });
                        }
                    } else {
                        res.status(500).json({ error: "user not found" })
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
}

exports.googleLogin = async (req, res) => {
    const { email, name, photoURL } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) { // If user exists, create JWT and return it
            // If user logs in with Google, update profile picture if it's different

            // Check if the user is suspended
            if (user.suspended) {
                return res.status(403).json({ msg: 'Your account has been suspended.', suspended: true });
            }

            // Log the successful login activity
            const loginActivity = new LoginActivity({ user: user.id });
            await loginActivity.save();

            const payload = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            return res.json({ token, msg: 'Logged in successfully!' });
        }
        // If user does not exist, create a new user
        user = new User({
            name,
            email,
            password: await bcrypt.hash('password', await bcrypt.genSalt(10)), // Placeholder password, not used for Google login
            role: 'user', // Default role for new users
            lastLogin: new Date(), // Set last login time
            profilePicture: photoURL,
            isActive: true, // Google users are active by default
        });
        await user.save();

        // Log the successful login activity for the new user
        const loginActivity = new LoginActivity({ user: user.id });
        await loginActivity.save();

        // Create JWT for the new user
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ token, msg: 'User registered and logged in successfully!' });
    } catch (err) {
        console.error('❌ Error during Google login:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {

    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        // Generate OTP (One Time Password)
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        // Save OTP to the database
        const otpEntry = new OTP({
            email,
            otp,
        });
        await otpEntry.save();
        // Send OTP via email
        try {
            // Define email options
            const mailOptions = {
                from: process.env.GMAIL, // Sender address (must be your Gmail address)
                to: email, // Recipient email address
                subject: "Password Reset otp", // Subject line
                text: "text", // Plain text body
                html: `<h1>Password Reset otp</h1><p>Your OTP is: <strong>${otp}</strong></p>` // HTML body (optional, can be used instead of or in addition to text)
            };
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            // You can log the preview URL for testing emails in development if you're not sending to a real address
            // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.status(200).json({ success: true, message: 'Email sent successfully!', messageId: info.messageId, });

        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
        }
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Failed to process forgot password request.', error: error.message });
    }

};

exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;

    try {
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // If email is being updated, check if it's already taken by another user
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email is already in use' });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;

        const updatedUser = await user.save();

        res.json(updatedUser);

    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        // req.user.id is from the auth middleware, which decodes the JWT
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.suspended) {
            // Log out on client side by sending an error
            return res.status(403).json({ msg: 'Your account has been suspended.', suspended: true });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const { profilePicture } = req.body; // Get base64 string from body

        if (!profilePicture) {
            return res.status(400).json({ msg: 'Please provide a profile picture.' });
        }

        const result = await User.updateOne(
            { _id: req.user.id },
            { $set: { profilePicture } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Return the new base64 string so the client can update immediately
        res.status(200).json({
            msg: 'Profile picture updated successfully',
            profilePicture: profilePicture
        });

    } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { otp, email, newPassword } = req.body;

    try {
        // Find the OTP entry
        const otpEntry = await OTP.findOne({ email, otp });
        if (!otpEntry) {
            return res.status(400).json({ success: false, message: 'Invalid OTP or email.' });
        }

        // Check if OTP is expired
        const currentTime = new Date();
        if (otpEntry.createdAt.getTime() + (5 * 60 * 1000) < currentTime.getTime()) {
            await otpEntry.deleteOne(); // Clean up expired OTP
            return res.status(400).json({ success: false, message: 'OTP has expired.' });
        }

        // Find the user to ensure they exist before trying to update
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Hash new password and update it without loading the full document
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

        // Delete the OTP after successful use
        await otpEntry.deleteOne();
        res.status(200).json({ success: true, message: 'Password reset successfully!' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password.', error: error.message });
    }

};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};