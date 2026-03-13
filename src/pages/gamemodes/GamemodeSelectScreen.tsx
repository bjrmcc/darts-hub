import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';

export default function GamemodeSelectScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Choose a Gamemode</h2>
      <button onClick={() => navigate(ROUTES.X01_SETUP)}>501 / 301</button>
      <button onClick={() => navigate(ROUTES.CRICKET_SETUP)}>Cricket</button>
      <button onClick={() => navigate(ROUTES.ATC_SETUP)}>Around the Clock</button>
      <button onClick={() => navigate(ROUTES.PRACTICE)}>Practice</button>
      <button onClick={() => navigate(ROUTES.HOME)}>Back</button>
    </div>
  );
}
