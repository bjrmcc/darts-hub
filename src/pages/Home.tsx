import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Darts Hub</h1>
      <nav className="home-nav">
        <button onClick={() => navigate(ROUTES.GAMEMODES)}>Play</button>
        <button onClick={() => navigate(ROUTES.STATISTICS)}>Statistics</button>
        <button onClick={() => navigate(ROUTES.LEADERBOARD)}>Leaderboard</button>
      </nav>
    </div>
  );
}
