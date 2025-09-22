const Search = require('../models/searches');

// @desc    Create a new search
// @route   POST /searches/search
// @access  Public
exports.createSearch = async (req, res, next) => {
    try {
        const filter = { email: req.user.email, search: req.body.data };
        const update = { ...filter, updatedAt: new Date() };
        const newSearch = await Search.findOneAndUpdate(filter, update, {
            new: true, // return the new or updated document
            upsert: true // create if it doesn't exist
        });
        res.status(201).json({
            success: true,
            data: newSearch
        });
    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all searches
// @route   GET /searches/searched
// @access  Public
exports.getSearches = async (req, res, next) => {
    try {
        // Only find searches for the logged in user and sort by most recently updated.
        const searches = await Search.find({ email: req.user.email })
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: searches.length, data: searches });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
