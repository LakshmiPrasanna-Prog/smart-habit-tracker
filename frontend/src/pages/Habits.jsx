import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('daily');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    try {
      await api.post(`/checkins/${id}`);
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Hi, {user?.name}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <form onSubmit={handleAdd} style={{ marginTop: 20, marginBottom: 20 }}>
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
          {habits.map((habit) => (
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
                </div>
              </div>
              <div>
                <button onClick={() => handleCheckIn(habit._id)}>Check In</button>
                <button onClick={() => handleDelete(habit._id)} style={{ marginLeft: 8 }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}