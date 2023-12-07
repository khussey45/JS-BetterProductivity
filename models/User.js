// This is a Schema map to a MongoDb Collection for User Events
// This includes a new registered account login or github or google oauth credentials 

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

  username: {
    type: String,
    required: function() { return !this.githubId && !this.googleId; }, 
    unique: true
  },
  password: {
    type: String,
    required: function() { return !this.githubId && !this.googleId; } 
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true 
  },
  githubUsername: String, 
  githubProfileUrl: String, 
  avatarUrl: String, 


  googleId: {
    type: String,
    unique: true,
    sparse: true 
  },
  googleEmail: String, 
  googleDisplayName: String, 
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
