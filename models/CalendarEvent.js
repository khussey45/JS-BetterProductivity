// This is a Schema map to a MongoDb Collection for Calendar Events

const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: String,
  description: String,
  startDate: Date,
  time: String, // New field for time
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
