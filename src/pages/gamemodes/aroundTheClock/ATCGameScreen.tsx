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

interface SeqItem {
  number: number;
  requiredMult: number | null; // null = any multiplier counts
  label: string;
}

function buildSequence(bullOut: boolean): SeqItem[] {
  const seq: SeqItem[] = [];
  for (let n = 1; n <= 20; n++) {
    seq.push({ number: n, requiredMult: null, label: String(n) });
  }
  if (bullOut) {
    seq.push({ number: 25, requiredMult: 1, label: 'Bull' });
    seq.push({ number: 25, requiredMult: 2, label: 'D-Bull' });
  }
  return seq;
}

export default function ATCGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const players: Profile[] = state?.players ?? [];
  const trebleDoubles: boolean = state?.trebleDoubles ?? false;
  const bullOut: boolean = state?.bullOut ?? true;

  const playerNames = players.map((p) => p.name);

  // All players share the same sequence structure
  const sequences = players.map(() => buildSequence(bullOut));

  interface ATCSnap { turn: TurnSnapshot; progress: number[]; }

  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);

  // progress[i] = number of sequence entries completed
  const [progress, setProgress] = useState<number[]>(() => playerNames.map(() => 0));

  const { currentPlayerIndex, currentPlayer, nextPlayer, dartIndex, lastTurn, bonusTurn, throwDart, throwMiss, snapshot, restore, getAllDarts } =
    useGameTurn(playerNames, { bonusTurnOnAllHits: true });

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  useEffect(() => {
    startSession('aroundTheClock', players.map((p) => p.id), { progress, currentPlayerIndex, playerNames })
      .then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (winner || !sessionStarted.current) return;
    pushState({ progress, currentPlayerIndex, dartIndex, playerNames, sequenceLength: sequences[0]?.length ?? 0 });
  }, [progress, currentPlayerIndex, dartIndex]);

  const snapshotsRef = useRef<ATCSnap[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushSnapshot(prog: number[]) {
    snapshotsRef.current.push({ turn: snapshot(), progress: [...prog] });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    restore(prev.turn);
    setProgress(prev.progress);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  function handleHit(hit: DartHit) {
    pushSnapshot(progress);
    const pi = currentPlayerIndex;
    const seq = sequences[pi];
    const currentProgress = progress[pi];
    const item = seq[currentProgress];

    const isHit =
      item !== undefined &&
      hit.number === item.number &&
      (item.requiredMult === null || hit.multiplier === item.requiredMult);

    if (isHit) {
      // Bull items must be hit one-at-a-time; regular numbers advance by multiplier if trebleDoubles
      let adv: number = item.requiredMult !== null ? 1 : (trebleDoubles ? hit.multiplier : 1);
      // Never skip over a required-multiplier item (outer bull / inner bull)
      for (let step = 1; step < adv; step++) {
        if (seq[currentProgress + step]?.requiredMult !== null) { adv = step; break; }
      }
      const newProgress = Math.min(seq.length, currentProgress + adv);

      const next = [...progress];
      next[pi] = newProgress;
      setProgress(next);

      if (newProgress >= seq.length) {
        throwDart(hit, true);
        const winnerId = players.find((p) => p.name === currentPlayer)?.id ?? '';
        addResult({
          id: crypto.randomUUID(),
          gameMode: 'aroundTheClock',
          players: players.map((p) => p.id),
          winnerId,
          date: Date.now(),
          stats: buildGameStats(players, getAllDarts(), [winnerId]),
        });
        setWinner(currentPlayer);
        return;
      }
      throwDart(hit, true);
    } else {
      throwDart(hit, false);
    }
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
              {bonusTurn ? (
                <span className="bonus-turn-label">Go again!</span>
              ) : nextPlayer ? (
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
                <button className="game-back-btn" onClick={() => navigate(ROUTES.ATC_SETUP, { state })}>← Setup</button>
                <button className="miss-btn full-miss-btn" onClick={() => { pushSnapshot(progress); throwMiss(); }}>Miss</button>
                <button className="undo-btn" onClick={handleUndo} disabled={!canUndo}>Undo ↩</button>
              </>
            )}
          </div>
        </div>

        {/* Right: chalkboard — per-player number boards */}
        <div className="chalkboard">
          <div className="chalk-atc-players">
            {playerNames.map((name, i) => {
              const isActive = i === currentPlayerIndex;
              const done = progress[i];
              const seq = sequences[i];

              return (
                <div key={i} className={`chalk-atc-player ${isActive ? 'chalk-atc-active' : ''}`}>
                  <span className={`chalk-team-name ${isActive ? 'chalk-active-team' : ''}`}>
                    {name}
                  </span>
                  <div className="atc-grid">
                    {seq.map((item, seqIdx) => {
                      const isHit = seqIdx < done;
                      const isTarget = seqIdx === done;
                      return (
                        <span
                          key={seqIdx}
                          className={`atc-num ${isHit ? 'atc-num--hit' : isTarget ? 'atc-num--target' : 'atc-num--pending'}`}
                        >
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
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
