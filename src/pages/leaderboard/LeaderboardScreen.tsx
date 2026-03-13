import { useNavigate } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const profiles = useProfilesStore((s) => s.profiles);
  const history = useStatisticsStore((s) => s.history);

  const wins = profiles
    .map((p) => ({
      name: p.name,
      wins: history.filter((g) => g.winnerId === p.id).length,
    }))
    .sort((a, b) => b.wins - a.wins);

  return (
    <div className="page">
      <h2>Leaderboard</h2>
      {wins.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <ol>
          {wins.map((p) => (
            <li key={p.name}>
              {p.name} — {p.wins} win(s)
            </li>
          ))}
        </ol>
      )}
      <button onClick={() => navigate(ROUTES.HOME)}>Back</button>
    </div>
  );
}
