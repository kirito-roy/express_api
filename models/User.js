const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    // match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  token_version: {
    type: Number,
    default: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  profile_picture: {
    type: String,
    default: null
  },
  phone_number: {
    type: String,
    default: null
  },
  last_login: {
    type: Date,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  }
});
module.exports = mongoose.model('User', UserSchema);