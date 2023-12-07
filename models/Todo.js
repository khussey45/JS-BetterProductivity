// This is a Schema map to a MongoDb Collection for ToDo list  Events


const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  content: String,
  completed: Boolean,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Todo', todoSchema);
