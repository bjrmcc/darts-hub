import { useGoto } from '../../hooks/useGoto';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import DataLoading from '../../components/shared/DataLoading';
import { ROUTES } from '../../constants';

export default function LeaderboardScreen() {
  const goto = useGoto();
  const profiles = useProfilesStore((s) => s.profiles);
  const history = useStatisticsStore((s) => s.history);
  const statsLoaded = useStatisticsStore((s) => s.loaded);

  const wins = profiles
    .map((p) => ({
      name: p.name,
      wins: history.filter((g) => g.winnerId === p.id).length,
    }))
    .sort((a, b) => b.wins - a.wins);

  return (
    <div className="page">
      <h2>Leaderboard</h2>
      {!statsLoaded ? (
        <DataLoading />
      ) : wins.length === 0 ? (
        <p className="hint">No games played yet.</p>
      ) : (
        <ol>
          {wins.map((p) => (
            <li key={p.name}>
              {p.name} — {p.wins} win(s)
            </li>
          ))}
        </ol>
      )}
      <button onClick={() => goto(ROUTES.STATS_HOME)}>Back</button>
    </div>
  );
}
