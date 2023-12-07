const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return !this.githubId; }, // Required if no GitHub ID
    unique: true
  },
  password: {
    type: String,
    required: function() { return !this.githubId; } // Required if no GitHub ID
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true // Sparse index, so that you can have multiple null values
  },
  // Optionally, you can add more fields to store additional information from GitHub
  githubUsername: String, // GitHub username
  githubProfileUrl: String, // GitHub profile URL
  avatarUrl: String // GitHub avatar URL
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
