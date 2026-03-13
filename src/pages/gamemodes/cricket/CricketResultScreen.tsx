import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function CricketResultScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Cricket — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Play Again</button>
      <button onClick={() => navigate(ROUTES.HOME)}>Home</button>
    </div>
  );
}
