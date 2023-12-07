const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return !this.githubId && !this.googleId; }, // Required if no GitHub or Google ID
    unique: true
  },
  password: {
    type: String,
    required: function() { return !this.githubId && !this.googleId; } // Required if no GitHub or Google ID
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true // Sparse index, allows multiple null values
  },
  githubUsername: String, // GitHub username
  githubProfileUrl: String, // GitHub profile URL
  avatarUrl: String, // GitHub avatar URL

  // Adding Google-specific fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  googleEmail: String, // Google email
  googleDisplayName: String, // Google display name
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
