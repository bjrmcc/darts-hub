import { useNavigate } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { ROUTES } from '../../constants';

export default function StatisticsScreen() {
  const navigate = useNavigate();
  const history = useStatisticsStore((s) => s.history);

  return (
    <div className="page">
      <h2>Statistics</h2>
      {history.length === 0 ? (
        <p>No games played yet.</p>
      ) : (
        <p>{history.length} game(s) played.</p>
      )}
      <button onClick={() => navigate(ROUTES.HOME)}>Back</button>
    </div>
  );
}
