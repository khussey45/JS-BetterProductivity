// This is a Schema map to a MongoDb Collection for Food Item Events

const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: String,
  carbs: Number,
  protein: Number,
  calories: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
