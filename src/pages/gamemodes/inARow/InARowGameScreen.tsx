import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GameBoard, { type DartHit } from '../../../components/dartboard/GameBoard';
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';
import WinOverlay from '../../../components/shared/WinOverlay';
import { useStatisticsStore } from '../../../store/statisticsStore';
import { buildGameStats } from '../../../utils/buildGameStats';
import { useGameSessionStore } from '../../../store/gameSessionStore';
import { cpuProfileFromDifficulty, simulateDart, aimFirstTo } from '../../../utils/cpuPlayer';
import { useCpuTurn } from '../../../hooks/useCpuTurn';
import type { DartEntry } from '../../../hooks/useGameTurn';

interface IARSnap {
  dartIndex: number;
  currentPlayerIndex: number;
  visitDarts: (DartHit | 'miss')[];
  lastVisit: { name: string; darts: (DartHit | 'miss')[] } | null;
  hits: number[];
  streak: number[];
  visitsDone: number[];
  extending: boolean[];
  playerDone: boolean[];
  allDartsLength: number;
}

export default function InARowGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mode: string = state?.mode ?? 'players';
  const difficulty: number = state?.difficulty ?? 15;
  const targetNumber: number = state?.targetNumber ?? 20;
  const visits: number = state?.visits ?? 10;

  const CPU_PLAYER: Profile = useMemo(() => ({ id: 'cpu', name: 'CPU', createdAt: 0 }), []);
  const players: Profile[] = useMemo(() => {
    const base: Profile[] = state?.players ?? [];
    return mode === 'cpu' ? [...base, CPU_PLAYER] : base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cpuProfile = useMemo(() => cpuProfileFromDifficulty(difficulty), [difficulty]);

  // Turn tracking
  const [dartIndex, setDartIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [visitDarts, setVisitDarts] = useState<(DartHit | 'miss')[]>([]);
  const [lastVisit, setLastVisit] = useState<{ name: string; darts: (DartHit | 'miss')[] } | null>(null);

  // Per-player state
  const [hits, setHits] = useState<number[]>(players.map(() => 0));
  const [streak, setStreak] = useState<number[]>(players.map(() => 0));
  const [visitsDone, setVisitsDone] = useState<number[]>(players.map(() => 0));
  const [extending, setExtending] = useState<boolean[]>(players.map(() => false));
  const [playerDone, setPlayerDone] = useState<boolean[]>(players.map(() => false));

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const allDartsRef = useRef<DartEntry[]>([]);
  const snapshotsRef = useRef<IARSnap[]>([]);

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  useEffect(() => {
    startSession('inARow', players.map((p) => p.id), { hits, targetNumber, visits, currentPlayerIndex })
      .then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (gameOver || !sessionStarted.current) return;
    pushState({ hits, targetNumber, visits, currentPlayerIndex, dartIndex });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, currentPlayerIndex, dartIndex]);

  // Derived display values
  const currentPlayer = players[currentPlayerIndex];
  const nextPlayer = useMemo(() => {
    let i = (currentPlayerIndex + 1) % players.length;
    let count = 0;
    while (playerDone[i] && count < players.length) { i = (i + 1) % players.length; count++; }
    return i !== currentPlayerIndex ? players[i]?.name : null;
  }, [currentPlayerIndex, playerDone, players]);

  function pushSnapshot() {
    snapshotsRef.current.push({
      dartIndex, currentPlayerIndex,
      visitDarts: [...visitDarts],
      lastVisit,
      hits: [...hits],
      streak: [...streak],
      visitsDone: [...visitsDone],
      extending: [...extending],
      playerDone: [...playerDone],
      allDartsLength: allDartsRef.current.length,
    });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    setDartIndex(prev.dartIndex);
    setCurrentPlayerIndex(prev.currentPlayerIndex);
    setVisitDarts(prev.visitDarts);
    setLastVisit(prev.lastVisit);
    setHits(prev.hits);
    setStreak(prev.streak);
    setVisitsDone(prev.visitsDone);
    setExtending(prev.extending);
    setPlayerDone(prev.playerDone);
    allDartsRef.current = allDartsRef.current.slice(0, prev.allDartsLength);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  function handleThrow(dart: DartHit | 'miss') {
    if (gameOver) return;

    const playerIdx = currentPlayerIndex;
    const isHit = dart !== 'miss' && (dart as DartHit).number === targetNumber;
    const isLastDart = dartIndex === 2;

    pushSnapshot();

    allDartsRef.current.push({
      playerName: players[playerIdx].name,
      dart,
      position: dartIndex as 0 | 1 | 2,
    });

    const newDarts = [...visitDarts, dart];
    const newHits = [...hits];
    const newStreak = [...streak];

    if (isHit) {
      newHits[playerIdx]++;
      newStreak[playerIdx]++;
    } else {
      newStreak[playerIdx] = 0;
    }

    if (!isLastDart) {
      setHits(newHits);
      setStreak(newStreak);
      setVisitDarts(newDarts);
      setDartIndex((d) => d + 1);
      return;
    }

    // Visit complete
    setLastVisit({ name: players[playerIdx].name, darts: newDarts });
    setVisitDarts([]);
    setDartIndex(0);
    setHits(newHits);
    setStreak(newStreak);

    const newVisitsDone = [...visitsDone];
    const newExtending = [...extending];
    const newPlayerDone = [...playerDone];

    if (extending[playerIdx]) {
      // In extension: end if streak broke (last dart was a miss)
      if (newStreak[playerIdx] === 0) {
        newExtending[playerIdx] = false;
        newPlayerDone[playerIdx] = true;
      }
    } else {
      newVisitsDone[playerIdx]++;
      if (newVisitsDone[playerIdx] >= visits) {
        if (newStreak[playerIdx] > 0) {
          newExtending[playerIdx] = true;
        } else {
          newPlayerDone[playerIdx] = true;
        }
      }
    }

    setVisitsDone(newVisitsDone);
    setExtending(newExtending);
    setPlayerDone(newPlayerDone);

    if (newPlayerDone.every((d) => d)) {
      finishGame(newHits);
      return;
    }

    // Advance to next non-done player
    let nextIdx = (playerIdx + 1) % players.length;
    let safety = 0;
    while (newPlayerDone[nextIdx] && safety < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      safety++;
    }
    setCurrentPlayerIndex(nextIdx);
  }

  function finishGame(finalHits: number[]) {
    const maxHits = Math.max(...finalHits);
    const winnerIdx = finalHits.indexOf(maxHits);
    const winnerId = players[winnerIdx]?.id ?? '';

    if (!state?.practice) {
      addResult({
        id: crypto.randomUUID(),
        gameMode: 'inARow',
        players: players.map((p) => p.id),
        winnerId,
        date: Date.now(),
        stats: buildGameStats(players, allDartsRef.current, [winnerId]),
        meta: {
          targetNumber,
          visits,
          playerHits: players.map((p, i) => ({ playerId: p.id, hits: finalHits[i] })),
        },
      });
    }

    setWinner(players[winnerIdx]?.name ?? '');
    setGameOver(true);
  }

  const isCpuTurn = mode === 'cpu' && currentPlayer?.name === 'CPU' && !gameOver;
  useCpuTurn(isCpuTurn, dartIndex, () => {
    const aim = aimFirstTo(targetNumber);
    const result = simulateDart(aim, cpuProfile);
    handleThrow(result);
  }, cpuProfile.dartDelayMs);

  const targetLabel = targetNumber === 25 ? 'Bull' : String(targetNumber);

  return (
    <div className="cricket-screen">
      <div className="cricket-main">

        {/* Left: board + controls */}
        <div className="cricket-board-side">
          <div className="board-info-top">
            <div className="board-top-left">
              {lastVisit ? (
                <>
                  <span className="board-info-label">Last — {lastVisit.name}</span>
                  <span className="board-last-darts">
                    {lastVisit.darts.map((d, i) => (
                      <span key={i} className="board-last-dart">
                        {d === 'miss' ? 'Miss' : (d as DartHit).label}
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
              <span className="board-info-value throwing">{currentPlayer?.name ?? ''}</span>
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
            <GameBoard onHit={gameOver ? () => {} : (hit) => handleThrow(hit)} />
          </div>

          <div className="board-info-bottom">
            {viewing ? (
              <button className="win-exit-btn" onClick={() => navigate(ROUTES.HOME)}>Exit to Main Menu</button>
            ) : (
              <>
                {confirmLeave ? (
                  <>
                    <span className="game-leave-msg">Leave game?</span>
                    <button className="game-leave-confirm-btn" onClick={() => navigate(ROUTES.IN_A_ROW_SETUP, { state })}>Leave</button>
                    <button className="game-leave-cancel-btn" onClick={() => setConfirmLeave(false)}>Stay</button>
                  </>
                ) : (
                  <button className="game-back-btn" onClick={() => setConfirmLeave(true)}>← Setup</button>
                )}
                <button className="miss-btn full-miss-btn" onClick={() => handleThrow('miss')} disabled={gameOver}>Miss</button>
                <button className="undo-btn" onClick={handleUndo} disabled={!canUndo}>Undo ↩</button>
              </>
            )}
          </div>
        </div>

        {/* Right: chalkboard */}
        <div className="chalkboard">
          <div className="chalk-iar-header">
            <span className="chalk-iar-title">In a Row — {targetLabel}</span>
            <span className="chalk-iar-sub">{visits} visits</span>
          </div>
          <div className="chalk-rule" />

          <div className="chalk-iar-players">
            {players.map((p, i) => {
              const isActive = i === currentPlayerIndex && !gameOver;
              const isExt = extending[i];
              const isDone = playerDone[i];
              const visLeft = Math.max(0, visits - visitsDone[i]);

              return (
                <div
                  key={p.id}
                  className={`chalk-iar-player${isActive ? ' chalk-iar-active' : ''}${isDone ? ' chalk-iar-done' : ''}`}
                >
                  <div className="chalk-iar-name-row">
                    <span className={`chalk-team-name${isActive ? ' chalk-active-team' : ''}`}>{p.name}</span>
                    <span className={`chalk-iar-status${isExt ? ' chalk-iar-status--ext' : ''}`}>
                      {isDone ? '—' : isExt ? 'EXT' : `${visLeft}v`}
                    </span>
                  </div>
                  <div className="chalk-iar-scores">
                    <div className="chalk-iar-score-item">
                      <span className="chalk-iar-score-val">{hits[i]}</span>
                      <span className="chalk-iar-score-label">hits</span>
                    </div>
                    <div className="chalk-iar-score-item">
                      <span className={`chalk-iar-score-val${streak[i] > 0 ? ' chalk-iar-streak' : ''}`}>{streak[i]}</span>
                      <span className="chalk-iar-score-label">streak</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {gameOver && winner && !viewing && (
        <WinOverlay winner={winner} onHome={() => navigate(ROUTES.HOME)} onView={() => setViewing(true)} />
      )}
    </div>
  );
}
