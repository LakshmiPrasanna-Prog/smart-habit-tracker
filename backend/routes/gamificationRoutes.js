const express = require('express');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const authMiddleware = require('../middleware/authMiddleware');
const { computeStats } = require('../utils/gamification');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    const checkIns = await CheckIn.find({ userId: req.userId });
    res.json(computeStats(habits, checkIns));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;