// This is a Schema map to a MongoDb Collection for Sleep Events


const mongoose = require('mongoose');

const sleepSchema = new mongoose.Schema({
  quality: String,
  duration: Number, // Duration in hours
  date: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Sleep', sleepSchema);
