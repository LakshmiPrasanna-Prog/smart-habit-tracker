const ICONS = {
  'first-step': '🌱',
  'getting-warm': '🔥',
  'week-warrior': '⚔️',
  'habit-master': '👑',
  'weekly-winner': '📅',
  'point-collector': '⭐',
};

export default function GamificationPanel({ stats }) {
  if (!stats) return null;

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, marginBottom: 20, background: '#fffaf0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>🏆 Level {stats.level}</strong>
        <span><strong>{stats.points}</strong> points</span>
      </div>

      <div style={{ background: '#eee', borderRadius: 6, height: 10, marginTop: 8 }}>
        <div style={{ width: `${stats.progressPercent}%`, background: '#ff6600', height: 10, borderRadius: 6 }} />
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        {stats.pointsToNextLevel} points to Level {stats.level + 1} · {stats.activeDays} active days ·
        active streak {stats.activeDayStreak} days · best habit streak {stats.bestStreak} days
      </div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
        How points work: 10 per active day, +5 when you complete all your habits, +50 for every 7 active days in a row.
      </div>

      <div style={{ marginTop: 12 }}>
        <strong style={{ fontSize: 13 }}>Badges</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {stats.badges.map((b) => (
            <div
              key={b.id}
              title={b.description}
              style={{
                padding: '6px 10px',
                borderRadius: 20,
                fontSize: 12,
                border: '1px solid #ddd',
                background: b.earned ? '#e8f5e9' : '#f2f2f2',
                opacity: b.earned ? 1 : 0.55,
              }}
            >
              {b.earned ? ICONS[b.id] : '🔒'} {b.name} {!b.earned && <span style={{ color: '#888' }}>· {b.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}