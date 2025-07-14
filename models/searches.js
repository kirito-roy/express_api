// CREATE TABLE searches (     id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, search TEXT )

const mongoose = require('mongoose');
const SearchSchema = new mongoose.Schema({
    email: String,
    search: String,

});
module.exports = mongoose.model('Search', SearchSchema);