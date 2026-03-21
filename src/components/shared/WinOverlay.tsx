interface Props {
  winner: string;
  onHome: () => void;
  onView: () => void;
}

export default function WinOverlay({ winner, onHome, onView }: Props) {
  return (
    <div className="win-overlay">
      <div className="win-card">
        <span className="win-congrats">Congratulations</span>
        <span className="win-winner">{winner}</span>
        <span className="win-subtitle">wins!</span>
        <div className="win-actions">
          <button className="win-home-btn" onClick={onHome}>Return to Main Menu</button>
          <button className="win-view-btn" onClick={onView}>View Game</button>
        </div>
      </div>
    </div>
  );
}
