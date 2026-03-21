import { ROUTES } from '../../../constants';
import { useGoto } from '../../../hooks/useGoto';

export default function CricketResultScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Cricket — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => goto(ROUTES.CRICKET_SETUP)}>Play Again</button>
      <button onClick={() => goto(ROUTES.HOME)}>Home</button>
    </div>
  );
}
