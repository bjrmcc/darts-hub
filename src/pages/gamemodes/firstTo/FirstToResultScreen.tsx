import { ROUTES } from '../../../constants';
import { useGoto } from '../../../hooks/useGoto';

export default function FirstToResultScreen() {
  const goto = useGoto();
  return (
    <div className="page">
      <h2>First To — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => goto(ROUTES.FIRST_TO_SETUP)}>Play Again</button>
      <button className="secondary" onClick={() => goto(ROUTES.HOME)}>Home</button>
    </div>
  );
}
