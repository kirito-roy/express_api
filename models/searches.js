// CREATE TABLE searches (     id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, search TEXT )

const mongoose = require('mongoose');
const SearchSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Please add an email'],
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        search: {
            type: String,
            required: [true, 'Please add a search term'],
            trim: true
        }
    }, { timestamps: true });
module.exports = mongoose.model('Search', SearchSchema);