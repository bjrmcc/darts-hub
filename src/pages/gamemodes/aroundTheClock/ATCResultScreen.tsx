import { ROUTES } from '../../../constants';
import { useGoto } from '../../../hooks/useGoto';

export default function ATCResultScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Around the Clock — Result</h2>
      <p>Coming soon</p>
      <button onClick={() => goto(ROUTES.ATC_SETUP)}>Play Again</button>
      <button onClick={() => goto(ROUTES.HOME)}>Home</button>
    </div>
  );
}
