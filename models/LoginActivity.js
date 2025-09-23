const mongoose = require('mongoose');

const LoginActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

// Create an index on the timestamp for faster querying of time ranges.
LoginActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('LoginActivity', LoginActivitySchema);