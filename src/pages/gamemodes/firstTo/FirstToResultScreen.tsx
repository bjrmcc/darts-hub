import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function FirstToResultScreen() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <h2>First To — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Play Again</button>
      <button className="secondary" onClick={() => navigate(ROUTES.HOME)}>Home</button>
    </div>
  );
}
