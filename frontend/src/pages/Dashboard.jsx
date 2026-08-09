import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/habits');
        const data = await Promise.all(
          res.data.map(async (habit) => {
            try {
              const streakRes = await api.get(`/checkins/${habit._id}/streak`);
              return { name: habit.title, streak: streakRes.data.streak };
            } catch {
              return { name: habit.title, streak: 0 };
            }
          })
        );
        setChartData(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <Link to="/habits">← Back to Habits</Link>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {chartData.length === 0 ? (
        <p>No habits yet — add some on the Habits page to see your progress here.</p>
      ) : (
        <div style={{ marginTop: 30, height: 300 }}>
          <h4>Current Streaks by Habit</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="streak" fill="#ff6600" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}