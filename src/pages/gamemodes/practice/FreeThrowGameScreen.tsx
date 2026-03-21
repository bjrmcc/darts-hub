import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameTurn, type TurnSnapshot } from '../../../hooks/useGameTurn';
import { ROUTES } from '../../../constants';
import GameBoard, { type DartHit } from '../../../components/dartboard/GameBoard';
import type { Profile } from '../../../types';

const ALL_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25] as const;

interface DartStat { aimed: number; hit: number; scoreSum: number; }
interface NumberStats { darts: [DartStat, DartStat, DartStat]; rounds: number; }

function pct(aimed: number, hit: number): string {
  if (aimed === 0) return '—';
  return Math.round((hit / aimed) * 100) + '%';
}

function avg(denominator: number, scoreSum: number): string {
  if (denominator === 0) return '—';
  return (scoreSum / denominator).toFixed(2);
}

function emptyStats(): NumberStats {
  return {
    darts: [
      { aimed: 0, hit: 0, scoreSum: 0 },
      { aimed: 0, hit: 0, scoreSum: 0 },
      { aimed: 0, hit: 0, scoreSum: 0 },
    ],
    rounds: 0,
  };
}

interface FTSnap { turn: TurnSnapshot; stats: Record<number, NumberStats>; targetNumber: number | null; }

export default function FreeThrowGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const players: Profile[] = state?.players ?? [];
  const playerNames = players.map((p) => p.name);

  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const [stats, setStats] = useState<Record<number, NumberStats>>(() => {
    const s: Record<number, NumberStats> = {};
    for (const n of ALL_NUMBERS) s[n] = emptyStats();
    return s;
  });

  const { currentPlayer, nextPlayer, dartIndex, lastTurn, throwDart, throwMiss, snapshot, restore } =
    useGameTurn(playerNames);

  const snapshotsRef = useRef<FTSnap[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushSnapshot() {
    snapshotsRef.current.push({
      turn: snapshot(),
      stats: JSON.parse(JSON.stringify(stats)) as Record<number, NumberStats>,
      targetNumber,
    });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    restore(prev.turn);
    setStats(prev.stats);
    setTargetNumber(prev.targetNumber);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  const needsTarget = targetNumber === null;

  function recordDart(dartPos: number, hitNumber: number | null, multiplier: number) {
    if (targetNumber === null) return;
    const isHit = hitNumber === targetNumber;
    setStats((prev) => {
      const entry = prev[targetNumber];
      const darts: [DartStat, DartStat, DartStat] = [
        { ...entry.darts[0] },
        { ...entry.darts[1] },
        { ...entry.darts[2] },
      ];
      darts[dartPos] = {
        aimed: darts[dartPos].aimed + 1,
        hit: darts[dartPos].hit + (isHit ? 1 : 0),
        scoreSum: darts[dartPos].scoreSum + (isHit ? multiplier : 0),
      };
      return {
        ...prev,
        [targetNumber]: {
          darts,
          rounds: entry.rounds + (dartPos === 0 ? 1 : 0),
        },
      };
    });
  }

  function handleHit(hit: DartHit) {
    if (needsTarget) return;
    pushSnapshot();
    const pos = dartIndex;
    const isLastDart = dartIndex === 2;
    recordDart(pos, hit.number, hit.multiplier);
    throwDart(hit);
    if (isLastDart && !locked) setTargetNumber(null);
  }

  function handleMiss() {
    if (needsTarget) return;
    pushSnapshot();
    const pos = dartIndex;
    const isLastDart = dartIndex === 2;
    recordDart(pos, null, 0);
    throwMiss();
    if (isLastDart && !locked) setTargetNumber(null);
  }

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

          {needsTarget ? (
            <div className="ft-target-select">
              <div className="ft-target-select-header">
                <p className="ft-target-prompt">Select target for this round</p>
                <label className="ft-lock-toggle">
                  <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
                  Lock number
                </label>
              </div>
              <div className="ft-number-grid">
                {ALL_NUMBERS.map((n) => (
                  <button key={n} className="ft-number-btn" onClick={() => setTargetNumber(n)}>
                    {n === 25 ? 'Bull' : n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="ft-target-active">
                <span className="ft-target-label">
                  Aiming: <strong>{targetNumber === 25 ? 'Bull' : targetNumber}</strong>
                </span>
                <label className="ft-lock-toggle">
                  <input type="checkbox" checked={locked} onChange={(e) => {
                    setLocked(e.target.checked);
                    if (!e.target.checked && dartIndex === 0) setTargetNumber(null);
                  }} />
                  Lock
                </label>
                {!locked && (
                  <button className="ft-change-btn" onClick={() => setTargetNumber(null)}>
                    Change
                  </button>
                )}
              </div>
              <div className="board-svg-wrap">
                <GameBoard onHit={handleHit} />
              </div>
              <div className="board-info-bottom">
                <button className="game-back-btn" onClick={() => navigate(ROUTES.PRACTICE, { state })}>← Setup</button>
                <button className="miss-btn full-miss-btn" onClick={handleMiss}>Miss</button>
                <button className="undo-btn" onClick={handleUndo} disabled={!canUndo}>Undo ↩</button>
              </div>
            </>
          )}
        </div>

        {/* Right: stats panel */}
        <div className="chalkboard ft-stats-panel">
          <div className="ft-stats-header">
            <span className="ft-stats-num">No.</span>
            <span className="ft-stats-cell">D1</span>
            <span className="ft-stats-cell">D2</span>
            <span className="ft-stats-cell">D3</span>
            <span className="ft-stats-cell ft-stats-avg">All</span>
          </div>
          <div className="chalk-rule" />
          <div className="ft-stats-rows">
            {ALL_NUMBERS.map((n) => {
              const { darts: s, rounds } = stats[n];
              const totalHit = s[0].hit + s[1].hit + s[2].hit;
              const totalScore = s[0].scoreSum + s[1].scoreSum + s[2].scoreSum;
              const isTarget = n === targetNumber;
              return (
                <div key={n} className={`ft-stats-row ${isTarget ? 'ft-stats-row--active' : ''}`}>
                  <span className="ft-stats-num">{n === 25 ? 'Bull' : n}</span>
                  {([0, 1, 2] as const).map((pos) => (
                    <div key={pos} className="ft-stats-cell ft-stats-stack">
                      <span className="ft-stack-pct">{pct(s[pos].aimed, s[pos].hit)}</span>
                      <span className="ft-stack-avg">{avg(s[pos].aimed, s[pos].scoreSum)}</span>
                    </div>
                  ))}
                  <div className="ft-stats-cell ft-stats-stack ft-stats-avg">
                    <span className="ft-stack-pct">{pct(rounds * 3, totalHit)}</span>
                    <span className="ft-stack-avg">{avg(rounds, totalScore)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
