const express = require('express');
const CheckIn = require('../models/CheckIn');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Mark a habit as done today
router.post('/:habitId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const existing = await CheckIn.findOne({
      habitId: req.params.habitId,
      date: today
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const checkIn = await CheckIn.create({
      habitId: req.params.habitId,
      userId: req.userId,
      date: today
    });

    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get streak for a habit
router.get('/:habitId/streak', async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ habitId: req.params.habitId })
      .sort({ date: -1 }); // most recent first

    if (checkIns.length === 0) {
      return res.json({ streak: 0 });
    }

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < checkIns.length; i++) {
      const expectedDate = currentDate.toISOString().split('T')[0];

      if (checkIns[i].date === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // go back one day
      } else {
        break; // streak is broken
      }
    }

    res.json({ streak });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;