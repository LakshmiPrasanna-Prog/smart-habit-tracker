import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import GamificationPanel from '../components/GamificationPanel';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('daily');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const earnedBefore = useRef(null);
  const pointsBefore = useRef(null);
  const messageTimer = useRef(null);

  const showMessage = (text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 3500);
  };

    const fetchStats = async () => {
    try {
      const res = await api.get('/gamification');
      const earnedNow = res.data.badges.filter((b) => b.earned).map((b) => b.id);
      const parts = [];
      if (pointsBefore.current !== null && res.data.points > pointsBefore.current) {
        parts.push(`🎉 +${res.data.points - pointsBefore.current} points!`);
      }
      if (earnedBefore.current) {
        const newOnes = res.data.badges.filter((b) => b.earned && !earnedBefore.current.includes(b.id));
        if (newOnes.length > 0) {
          parts.push(`🏅 New badge unlocked: ${newOnes.map((b) => b.name).join(', ')}`);
        }
      }
      if (parts.length > 0) showMessage(parts.join('   '));
      pointsBefore.current = res.data.points;
      earnedBefore.current = earnedNow;
      setStats(res.data);
    } catch (err) {
      // gamification is extra: if it fails, the rest of the page still works
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await api.get('/habits');
      setHabits(res.data);
      const streakData = {};
      await Promise.all(
        res.data.map(async (habit) => {
          try {
            const streakRes = await api.get(`/checkins/${habit._id}/streak`);
            streakData[habit._id] = streakRes.data.streak;
          } catch {
            streakData[habit._id] = 0;
          }
        })
      );
      setStreaks(streakData);
      fetchStats();
    } catch (err) {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/habits', { title, category, frequency });
      setTitle('');
      setCategory('General');
      setFrequency('daily');
      fetchHabits();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add habit');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err) {
      setError('Failed to delete habit');
    }
  };

  const handleCheckIn = async (id) => {
    setError('');
    try {
      await api.post(`/checkins/${id}`);
           showMessage('✅ Checked in!');
      fetchHabits();
    } catch (err) {
      setError(err.response?.data?.message || 'Already checked in today');
    }
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    setError('');
    try {
      const res = await api.get('/ai/suggestions');
      setSuggestions(res.data.suggestions);
    } catch (err) {
      setError('Failed to get AI suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestion = async (suggestedTitle) => {
    try {
      await api.post('/habits', { title: suggestedTitle, category: 'AI Suggested', frequency: 'daily' });
      setSuggestions((prev) => prev.filter((s) => s.title !== suggestedTitle));
      fetchHabits();
    } catch (err) {
      setError('Failed to add suggested habit');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statsByHabit = {};
  (stats?.habits || []).forEach((h) => {
    statsByHabit[h.habitId] = h;
  });

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Hi, {user?.name}</h2>
        <div>
          <Link to="/dashboard" style={{ marginRight: 12 }}>📊 Dashboard</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {message && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: 10, marginTop: 10 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <GamificationPanel stats={stats} />
      </div>

      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="New habit title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button type="submit" style={{ marginLeft: 8 }}>Add Habit</button>
      </form>

      <button onClick={handleGetSuggestions} disabled={loadingSuggestions} style={{ marginBottom: 20 }}>
        {loadingSuggestions ? 'Thinking...' : '✨ Get AI Habit Suggestions'}
      </button>

      {suggestions.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h4>AI Suggestions</h4>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                background: '#f9f9f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{s.title}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>{s.reason}</div>
              </div>
              <button onClick={() => handleAddSuggestion(s.title)}>Add</button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {habits.length === 0 ? (
        <p>No habits yet — add one above to get started.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {habits.map((habit) => {
            const hs = statsByHabit[habit._id];
            return (
              <li
                key={habit._id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{habit.title}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {habit.category} · {habit.frequency}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#ff6600', fontWeight: 'bold' }}>
                    🔥 {streaks[habit._id] ?? 0} day streak
                    {hs ? ` · 📅 ${hs.weeklyStreak} week streak · 🏅 best ${hs.longestStreak} days` : ''}
                  </div>
                </div>
                <div>
                  <button onClick={() => handleCheckIn(habit._id)}>Check In</button>
                  <button onClick={() => handleDelete(habit._id)} style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}