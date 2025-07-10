const express = require('express');
const router = express.Router();
const Student = require('../models/student');

router.get('/add', async (req, res) => {
    const student = new Student({ name: 'Kirito', rollNumber: '12345', class: '10th', age: 15, email: 'kirito@example.com' });
    await student.save();
    res.send('Student saved');
});

// 📋 [GET] List all students
router.get('/get', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        console.error('❌ Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;