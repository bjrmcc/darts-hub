import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function X01GameScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>501 / 301 — Game</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.X01_RESULT)}>End Game</button>
    </div>
  );
}
