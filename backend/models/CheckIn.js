const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // stored as 'YYYY-MM-DD' for easy comparison
    required: true
  }
}, { timestamps: true });

// Prevent duplicate check-ins for the same habit on the same day
checkInSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);