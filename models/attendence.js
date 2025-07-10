const mongoose = require('mongoose');
const AttendenceSchema = new mongoose.Schema({
    name: String,
    time: String,
    date: String,

});
module.exports = mongoose.model('Attendence', AttendenceSchema);