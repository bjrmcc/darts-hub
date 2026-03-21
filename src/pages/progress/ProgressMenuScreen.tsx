import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';

export default function ProgressMenuScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Progress</h2>
      <nav className="home-nav">
        <button onClick={() => goto(ROUTES.PROGRESS_PERSONAL)}>Personal Progress</button>
        <button onClick={() => goto(ROUTES.PROGRESS_GENERAL)}>General Progress</button>
      </nav>
      <button className="secondary" onClick={() => goto(ROUTES.STATS_HOME)}>Back</button>
    </div>
  );
}
