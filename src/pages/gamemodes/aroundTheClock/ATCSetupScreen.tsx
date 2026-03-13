import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function ATCSetupScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Around the Clock — Setup</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.ATC_GAME)}>Start Game</button>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Back</button>
    </div>
  );
}
