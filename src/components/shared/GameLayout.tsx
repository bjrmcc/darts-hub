import GameBoard, { type DartHit } from '../dartboard/GameBoard';
import { dartLabel, type TurnRecord } from '../../hooks/useGameTurn';

interface Props {
  currentPlayer: string;
  dartIndex: number;
  nextPlayer: string | null;
  lastTurn: TurnRecord | null;
  onHit: (hit: DartHit) => void;
  onMiss: () => void;
}

export default function GameLayout({
  currentPlayer,
  dartIndex,
  nextPlayer,
  lastTurn,
  onHit,
  onMiss,
}: Props) {
  return (
    <div className="game-screen">
      <div className="game-main">

        {/* Left panel — current player + dart indicators */}
        <div className="game-side left-panel">
          <span className="panel-label">NOW</span>
          <span className="panel-player-name">{currentPlayer}</span>
          <div className="dart-indicators">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`dart-dot ${
                  i < dartIndex ? 'dart-thrown' : i === dartIndex ? 'dart-active' : 'dart-pending'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dartboard */}
        <div className="game-board-wrap">
          <GameBoard onHit={onHit} />
        </div>

        {/* Right panel — next player + last turn */}
        <div className="game-side right-panel">
          {nextPlayer && (
            <>
              <span className="panel-label">NEXT</span>
              <span className="panel-player-name next-name">{nextPlayer}</span>
            </>
          )}
          {lastTurn && (
            <div className="last-turn-summary">
              <span className="panel-label">LAST</span>
              <span className="last-turn-player">{lastTurn.playerName}</span>
              {lastTurn.darts.map((d, i) => (
                <span key={i} className="last-dart-label">{dartLabel(d)}</span>
              ))}
              <span className="last-turn-total">= {lastTurn.total}</span>
            </div>
          )}
        </div>

      </div>

      {/* Miss button */}
      <div className="game-miss-area">
        <button className="miss-btn" onClick={onMiss}>Miss</button>
      </div>
    </div>
  );
}
