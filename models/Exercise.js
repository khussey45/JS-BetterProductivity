// This is a Schema map to a MongoDb Collection for Exercise Events

const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: String,
  duration: Number, // Duration in minutes
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
