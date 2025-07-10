const express = require('express');
const router = express.Router();
const Attendence = require('../models/attendence');
const auth = require('../middleware/authMiddleware'); // Add auth middleware import

router.post('/att/set', auth, async (req, res) => {
    // const student = new Student({ name: 'Kirito', rollNumber: '12345', class: '10th', age: 15, email: 'kirito@example.com' });
    // await student.save();
    // res.send('Student saved');
    const { name, time, date } = req.body;
    if (!name || !time || !date) {
        return res.status(400).json({ error: 'Name, time, and date are required' });
    }
    try {
        const attendence = new Attendence({ name, time, date });
        await attendence.save();
        res.status(201).json({ message: 'Attendence recorded successfully' });
    } catch (err) {
        console.error('❌ Error recording attendence:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📋 [GET] List all students
router.get('/att/get', auth, async (req, res) => {
    // try {
    //     const students = await Student.find();
    //     res.json(students);
    // } catch (err) {
    //     console.error('❌ Error fetching students:', err);
    //     res.status(500).json({ error: 'Internal server error' });
    // }
    try {
        const attendenceRecords = await Attendence.find();
        res.json(attendenceRecords);
    } catch (err) {
        console.error('❌ Error fetching attendence records:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;