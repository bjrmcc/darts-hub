import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function X01ResultScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>501 / 301 — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Play Again</button>
      <button onClick={() => navigate(ROUTES.HOME)}>Home</button>
    </div>
  );
}
