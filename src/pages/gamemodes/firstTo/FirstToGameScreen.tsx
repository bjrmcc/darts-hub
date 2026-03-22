import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameTurn, type TurnSnapshot } from '../../../hooks/useGameTurn';
import GameBoard, { type DartHit } from '../../../components/dartboard/GameBoard';
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';
import WinOverlay from '../../../components/shared/WinOverlay';
import { useStatisticsStore } from '../../../store/statisticsStore';
import { buildGameStats } from '../../../utils/buildGameStats';
import { useGameSessionStore } from '../../../store/gameSessionStore';

// Fewer players = wider columns = more groups of 5 fit per row
function groupsPerRow(playerCount: number): number {
  if (playerCount <= 2) return 3; // 15 per row
  if (playerCount === 3) return 2; // 10 per row
  return 1;                        // 5 per row
}

function TallyMarks({ count, perRow }: { count: number; perRow: number }) {
  if (count === 0) return <span className="tally-empty">—</span>;

  const groups: number[] = [];
  let remaining = count;
  while (remaining >= 5) { groups.push(5); remaining -= 5; }
  if (remaining > 0) groups.push(remaining);

  // Split into rows of perRow groups
  const rows: number[][] = [];
  for (let i = 0; i < groups.length; i += perRow) {
    rows.push(groups.slice(i, i + perRow));
  }

  return (
    <div className="tally-lines">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="tally-row">
          {row.map((g, i) => (
            <span key={i} className="tally-group">
              {'|'.repeat(Math.min(g, 4))}
              {g === 5 && <span className="tally-slash" aria-hidden="true" />}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function FirstToGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const players: Profile[] = state?.players ?? [];
  const targetNumber: number = state?.targetNumber ?? 20;
  const targetHits: number = state?.targetHits ?? 10;

  const playerNames = players.map((p) => p.name);
  interface FTSnap { turn: TurnSnapshot; hits: number[]; }

  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [hits, setHits] = useState<number[]>(() => playerNames.map(() => 0));

  const { currentPlayerIndex, currentPlayer, nextPlayer, dartIndex, lastTurn, throwDart, throwMiss, snapshot, restore, getAllDarts } =
    useGameTurn(playerNames);

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  useEffect(() => {
    startSession('firstTo', players.map((p) => p.id), { hits, targetNumber, targetHits, currentPlayerIndex, playerNames })
      .then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (winner || !sessionStarted.current) return;
    pushState({ hits, targetNumber, targetHits, currentPlayerIndex, dartIndex, playerNames });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, currentPlayerIndex, dartIndex]);

  const snapshotsRef = useRef<FTSnap[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushSnapshot(currentHits: number[]) {
    snapshotsRef.current.push({ turn: snapshot(), hits: [...currentHits] });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    restore(prev.turn);
    setHits(prev.hits);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  const perRow = groupsPerRow(players.length);

  function handleHit(hit: DartHit) {
    pushSnapshot(hits);
    if (hit.number === targetNumber) {
      const newHits = [...hits];
      // Doubles count as 2, trebles as 3
      newHits[currentPlayerIndex] = Math.min(targetHits, newHits[currentPlayerIndex] + hit.multiplier);
      setHits(newHits);

      if (newHits[currentPlayerIndex] >= targetHits) {
        throwDart(hit);
        const winnerId = players.find((p) => p.name === currentPlayer)?.id ?? '';
        addResult({
          id: crypto.randomUUID(),
          gameMode: 'firstTo',
          players: players.map((p) => p.id),
          winnerId,
          date: Date.now(),
          stats: buildGameStats(players, getAllDarts(), [winnerId]),
          meta: { targetNumber, targetHits },
        });
        setWinner(currentPlayer);
        return;
      }
    }
    throwDart(hit);
  }

  const targetLabel = targetNumber === 25 ? 'Bull' : String(targetNumber);

  return (
    <div className="cricket-screen">
      <div className="cricket-main">

        {/* Left: board + controls */}
        <div className="cricket-board-side">
          <div className="board-info-top">
            <div className="board-top-left">
              {lastTurn ? (
                <>
                  <span className="board-info-label">Last — {lastTurn.playerName}</span>
                  <span className="board-last-darts">
                    {lastTurn.darts.map((d, i) => (
                      <span key={i} className="board-last-dart">
                        {d === 'miss' ? 'Miss' : d.label}
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <span className="board-info-label board-info-label--faint">Last throw</span>
              )}
            </div>
            <div className="board-top-centre">
              <span className="board-info-label">Throwing</span>
              <span className="board-info-value throwing">{currentPlayer}</span>
              <div className="dart-indicators horizontal">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`dart-dot ${i < dartIndex ? 'dart-thrown' : i === dartIndex ? 'dart-active' : 'dart-pending'}`} />
                ))}
              </div>
            </div>
            <div className="board-top-right">
              {nextPlayer ? (
                <>
                  <span className="board-info-label">Next</span>
                  <span className="board-info-value">{nextPlayer}</span>
                </>
              ) : (
                <span className="board-info-label board-info-label--faint">Next</span>
              )}
            </div>
          </div>

          <div className="board-svg-wrap">
            <GameBoard onHit={winner ? () => {} : handleHit} />
          </div>

          <div className="board-info-bottom">
            {viewing ? (
              <button className="win-exit-btn" onClick={() => navigate(ROUTES.HOME)}>Exit to Main Menu</button>
            ) : (
              <>
                {confirmLeave ? (
                  <>
                    <span className="game-leave-msg">Leave game?</span>
                    <button className="game-leave-confirm-btn" onClick={() => navigate(ROUTES.FIRST_TO_SETUP, { state })}>Leave</button>
                    <button className="game-leave-cancel-btn" onClick={() => setConfirmLeave(false)}>Stay</button>
                  </>
                ) : (
                  <button className="game-back-btn" onClick={() => setConfirmLeave(true)}>← Setup</button>
                )}
                <button className="miss-btn full-miss-btn" onClick={() => { pushSnapshot(hits); throwMiss(); }}>Miss</button>
                <button className="undo-btn" onClick={handleUndo} disabled={!canUndo}>Undo ↩</button>
              </>
            )}
          </div>
        </div>

        {/* Right: chalkboard */}
        <div className="chalkboard">
          <div className="chalk-ft-header">
            <span className="chalk-ft-target">First to {targetHits} × {targetLabel}</span>
          </div>
          <div className="chalk-rule" />

          <div className="chalk-ft-players">
            {playerNames.map((name, i) => {
              const isActive = i === currentPlayerIndex;
              return (
                <div key={i} className={`chalk-ft-player ${isActive ? 'chalk-ft-active' : ''}`}>
                  <span className={`chalk-team-name ${isActive ? 'chalk-active-team' : ''}`}>
                    {name}
                  </span>
                  <TallyMarks count={hits[i]} perRow={perRow} />
                  <span className="chalk-ft-count">{hits[i]} / {targetHits}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {winner && !viewing && (
        <WinOverlay winner={winner} onHome={() => navigate(ROUTES.HOME)} onView={() => setViewing(true)} />
      )}
    </div>
  );
}
