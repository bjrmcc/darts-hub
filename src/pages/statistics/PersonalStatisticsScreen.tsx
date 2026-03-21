import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';

export default function PersonalStatisticsScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Personal Statistics</h2>
      <nav className="home-nav">
        <button onClick={() => goto(ROUTES.STATS_X01)}>X01</button>
        <button onClick={() => goto(ROUTES.STATS_CRICKET)}>Cricket</button>
        <button onClick={() => goto(ROUTES.STATS_ATC)}>Around the Clock</button>
        <button onClick={() => goto(ROUTES.STATS_FIRST_TO)}>First To</button>
        <button onClick={() => goto(ROUTES.STATS_FREE_THROW)}>Free Throw</button>
        <button onClick={() => goto(ROUTES.PROGRESS)}>Progress</button>
      </nav>
      <button className="secondary" onClick={() => goto(ROUTES.STATISTICS)}>Back</button>
    </div>
  );
}
