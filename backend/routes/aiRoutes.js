const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Habit = require('../models/Habit');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/suggestions', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, active: true });
    const habitTitles = habits.map(h => h.title);

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
    const prompt = habitTitles.length > 0
      ? `A user currently tracks these habits: ${habitTitles.join(', ')}. Suggest 3 new complementary habits that would help them build a well-rounded routine. Return ONLY a JSON array, no markdown formatting, no explanation, in this exact format: [{"title": "habit name", "reason": "one line reason"}]`
      : `Suggest 3 good beginner habits for someone starting a habit-tracking routine. Return ONLY a JSON array, no markdown formatting, no explanation, in this exact format: [{"title": "habit name", "reason": "one line reason"}]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    text = text.replace(/```json|```/g, '').trim();

    const suggestions = JSON.parse(text);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: 'AI suggestion error', error: err.message });
  }
});

module.exports = router;