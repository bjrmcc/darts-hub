import { ROUTES } from '../../../constants';
import { useGoto } from '../../../hooks/useGoto';

export default function X01ResultScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>501 / 301 — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => goto(ROUTES.X01_SETUP)}>Play Again</button>
      <button onClick={() => goto(ROUTES.HOME)}>Home</button>
    </div>
  );
}
