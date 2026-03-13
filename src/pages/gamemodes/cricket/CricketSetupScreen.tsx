import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function CricketSetupScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Cricket — Setup</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.CRICKET_GAME)}>Start Game</button>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Back</button>
    </div>
  );
}
