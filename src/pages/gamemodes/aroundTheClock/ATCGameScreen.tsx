import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function ATCGameScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Around the Clock — Game</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.ATC_RESULT)}>End Game</button>
    </div>
  );
}
