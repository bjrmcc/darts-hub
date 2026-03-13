import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function X01SetupScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>501 / 301 — Setup</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.X01_GAME)}>Start Game</button>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Back</button>
    </div>
  );
}
