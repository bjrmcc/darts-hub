import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

export default function PracticeScreen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Practice</h2>
      <p>Coming soon</p>
      <button onClick={() => navigate(ROUTES.GAMEMODES)}>Back</button>
    </div>
  );
}
