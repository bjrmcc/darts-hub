import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';

export default function GamemodeSelectScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Choose a Gamemode</h2>
      <button onClick={() => goto(ROUTES.X01_SETUP)}>X01</button>
      <button onClick={() => goto(ROUTES.CRICKET_SETUP)}>Cricket</button>
      <button onClick={() => goto(ROUTES.ATC_SETUP)}>Around the Clock</button>
      <button onClick={() => goto(ROUTES.FIRST_TO_SETUP)}>First To</button>
      <button onClick={() => goto(ROUTES.PRACTICE)}>Free Throw</button>
      <button onClick={() => goto(ROUTES.PLAY)}>Back</button>
    </div>
  );
}
