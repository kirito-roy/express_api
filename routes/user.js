const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/set', async (req, res) => {
    const user = new User({ name: 'Kirito', email: 'kirito@example.com' });
    await user.save();
    res.send('User saved');
});

// 📋 [GET] List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error('❌ Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// // Create new user (POST)
// router.post('/users', async (req, res) => {
//     try {
//         const { name, email } = req.body;
//         const user = new User({ name, email });
//         await user.save();
//         res.status(201).json(user);
//     } catch (err) {
//         console.error('❌ Error creating user:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Get a user by ID (GET)
// router.get('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) return res.status(404).json({ error: 'User not found' });
//         res.json(user);
//     } catch (err) {
//         console.error('❌ Error fetching user:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Delete user by ID
// router.delete('/users/:id', async (req, res) => {
//     try {
//         const result = await User.findByIdAndDelete(req.params.id);
//         if (!result) return res.status(404).json({ error: 'User not found' });
//         res.json({ message: 'User deleted' });
//     } catch (err) {
//         console.error('❌ Error deleting user:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


module.exports = router;