# Smart Habit Tracker with AI

A full-stack habit tracking application that uses AI to generate personalized habit recommendations, with streak tracking and progress visualization.

**Live Demo:** https://smart-habit-tracker-seven.vercel.app
**Backend API:** https://smart-habit-tracker-backend-tg4v.onrender.com

## Features

- Secure authentication with JWT and bcrypt password hashing
- Full CRUD for habit management
- Daily check-in system with automatic streak calculation
- AI-powered habit suggestions using Google's Gemini API
- Visual dashboard with streak charts (Recharts)
- Protected routes and middleware-based API authorization

## Tech Stack

**Frontend:** React (Vite), React Router, Axios, Recharts
**Backend:** Node.js, Express.js
**Database:** MongoDB (Atlas)
**AI:** Google Gemini API
**Deployment:** Vercel (frontend), Render (backend)

## Architecture

React (Vercel) -> Express API (Render) -> MongoDB Atlas, with Gemini API used for AI habit suggestions.

## Getting Started (Local Development)

### Backend
```bash
cd backend
npm install
# Create a .env file with MONGO_URI, JWT_SECRET, GEMINI_API_KEY, PORT
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create a .env file with VITE_API_URL=http://localhost:5000/api
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Authenticate user |
| GET | /api/habits | Get user's habits |
| POST | /api/habits | Create a new habit |
| PUT | /api/habits/:id | Update a habit |
| DELETE | /api/habits/:id | Delete a habit |
| POST | /api/checkins/:habitId | Check in a habit for today |
| GET | /api/checkins/:habitId/streak | Get current streak |
| GET | /api/ai/suggestions | Get AI-generated habit suggestions |

## Author

Upputala Sri Lakshmi Prasanna
