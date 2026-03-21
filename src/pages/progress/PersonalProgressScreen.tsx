import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';

export default function PersonalProgressScreen() {
  const goto = useGoto();

  return (
    <div className="page">
      <h2>Personal Progress</h2>
      <button className="secondary" onClick={() => goto(ROUTES.PROGRESS)}>Back</button>
    </div>
  );
}
