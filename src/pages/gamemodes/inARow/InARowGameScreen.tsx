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
import type { DartEntry } from '../../../hooks/useGameTurn';

interface IARSnap {
  currentPlayerIndex: number;
  goHits: number[];
  hits: number[];
  bestGo: number[];
  gosDone: number[];
  playerDone: boolean[];
  lastGoResult: { name: string; goHits: number } | null;
  dartPosCounter: number;
  allDartsLength: number;
}

export default function InARowGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mode: string = state?.mode ?? 'players';
  const difficulty: number = state?.difficulty ?? 15;
  const targetNumber: number = state?.targetNumber ?? 20;
  const goes: number = state?.visits ?? 10;

  const CPU_PLAYER: Profile = useMemo(() => ({ id: 'cpu', name: 'CPU', createdAt: 0 }), []);
  const players: Profile[] = useMemo(() => {
    const base: Profile[] = state?.players ?? [];
    return mode === 'cpu' ? [...base, CPU_PLAYER] : base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cpuProfile = useMemo(() => cpuProfileFromDifficulty(difficulty), [difficulty]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [goHits, setGoHits] = useState<number[]>(players.map(() => 0));
  const [hits, setHits] = useState<number[]>(players.map(() => 0));
  const [bestGo, setBestGo] = useState<number[]>(players.map(() => 0));
  const [gosDone, setGosDone] = useState<number[]>(players.map(() => 0));
  const [playerDone, setPlayerDone] = useState<boolean[]>(players.map(() => false));
  const [lastGoResult, setLastGoResult] = useState<{ name: string; goHits: number } | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const allDartsRef = useRef<DartEntry[]>([]);
  const dartPosCounterRef = useRef(0);
  const snapshotsRef = useRef<IARSnap[]>([]);

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  useEffect(() => {
    startSession('inARow', players.map((p) => p.id), { hits, targetNumber, goes, currentPlayerIndex })
      .then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (gameOver || !sessionStarted.current) return;
    pushState({ hits, targetNumber, goes, currentPlayerIndex });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, currentPlayerIndex]);

  const currentPlayer = players[currentPlayerIndex];

  const nextPlayer = useMemo(() => {
    let i = (currentPlayerIndex + 1) % players.length;
    let count = 0;
    while (playerDone[i] && count < players.length) { i = (i + 1) % players.length; count++; }
    return i !== currentPlayerIndex ? players[i]?.name : null;
  }, [currentPlayerIndex, playerDone, players]);

  function pushSnapshot() {
    snapshotsRef.current.push({
      currentPlayerIndex,
      goHits: [...goHits],
      hits: [...hits],
      bestGo: [...bestGo],
      gosDone: [...gosDone],
      playerDone: [...playerDone],
      lastGoResult,
      dartPosCounter: dartPosCounterRef.current,
      allDartsLength: allDartsRef.current.length,
    });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    setCurrentPlayerIndex(prev.currentPlayerIndex);
    setGoHits(prev.goHits);
    setHits(prev.hits);
    setBestGo(prev.bestGo);
    setGosDone(prev.gosDone);
    setPlayerDone(prev.playerDone);
    setLastGoResult(prev.lastGoResult);
    dartPosCounterRef.current = prev.dartPosCounter;
    allDartsRef.current = allDartsRef.current.slice(0, prev.allDartsLength);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  function handleThrow(dart: DartHit | 'miss') {
    if (gameOver) return;

    const playerIdx = currentPlayerIndex;
    const isHit = dart !== 'miss' && (dart as DartHit).number === targetNumber;

    pushSnapshot();

    allDartsRef.current.push({
      playerName: players[playerIdx].name,
      dart,
      position: (dartPosCounterRef.current % 3) as 0 | 1 | 2,
    });
    dartPosCounterRef.current++;

    if (isHit) {
      // Keep going — same player, another dart
      setHits((prev) => { const n = [...prev]; n[playerIdx]++; return n; });
      setGoHits((prev) => { const n = [...prev]; n[playerIdx]++; return n; });
      return;
    }

    // Miss — go ends
    const newGoHits = [...goHits];
    const thisGoHits = newGoHits[playerIdx];
    newGoHits[playerIdx] = 0;

    const newBestGo = [...bestGo];
    if (thisGoHits > newBestGo[playerIdx]) newBestGo[playerIdx] = thisGoHits;
    setBestGo(newBestGo);

    const newGosDone = [...gosDone];
    newGosDone[playerIdx]++;

    const newPlayerDone = [...playerDone];
    if (newGosDone[playerIdx] >= goes) {
      newPlayerDone[playerIdx] = true;
    }

    setLastGoResult({ name: players[playerIdx].name, goHits: thisGoHits });
    setGoHits(newGoHits);
    setGosDone(newGosDone);
    setPlayerDone(newPlayerDone);

    if (newPlayerDone.every((d) => d)) {
      finishGame(hits);
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
          goes,
          playerHits: players.map((p, i) => ({ playerId: p.id, hits: finalHits[i] })),
        },
      });
    }

    setWinner(players[winnerIdx]?.name ?? '');
    setGameOver(true);
  }

  // CPU: fire a dart whenever it's the CPU's turn. Re-triggers on goHits change (each hit) and
  // when isCpuTurn flips back to true at the start of a new go.
  const isCpuTurn = mode === 'cpu' && currentPlayer?.name === 'CPU' && !gameOver;
  useEffect(() => {
    if (!isCpuTurn) return;
    const t = setTimeout(() => {
      const aim = aimFirstTo(targetNumber);
      const result = simulateDart(aim, cpuProfile);
      handleThrow(result);
    }, cpuProfile.dartDelayMs);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCpuTurn, goHits[currentPlayerIndex]]);

  const targetLabel = targetNumber === 25 ? 'Bull' : String(targetNumber);

  return (
    <div className="cricket-screen">
      <div className="cricket-main">

        {/* Left: board + controls */}
        <div className="cricket-board-side">
          <div className="board-info-top">
            <div className="board-top-left">
              {lastGoResult ? (
                <>
                  <span className="board-info-label">Last go — {lastGoResult.name}</span>
                  <span className="board-info-value">{lastGoResult.goHits} hit{lastGoResult.goHits !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <span className="board-info-label board-info-label--faint">Last go</span>
              )}
            </div>
            <div className="board-top-centre">
              <span className="board-info-label">Throwing</span>
              <span className="board-info-value throwing">{currentPlayer?.name ?? ''}</span>
              <span className="board-info-label board-info-label--faint" style={{ fontSize: '0.72rem' }}>
                {goHits[currentPlayerIndex] > 0 ? `${goHits[currentPlayerIndex]} in a row` : 'throw until you miss'}
              </span>
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
            <span className="chalk-iar-sub">{goes} go{goes !== 1 ? 's' : ''} each</span>
          </div>
          <div className="chalk-rule" />

          <div className="chalk-iar-players">
            {players.map((p, i) => {
              const isActive = i === currentPlayerIndex && !gameOver;
              const isDone = playerDone[i];
              const goesLeft = Math.max(0, goes - gosDone[i]);

              return (
                <div
                  key={p.id}
                  className={`chalk-iar-player${isActive ? ' chalk-iar-active' : ''}${isDone ? ' chalk-iar-done' : ''}`}
                >
                  <div className="chalk-iar-name-row">
                    <span className={`chalk-team-name${isActive ? ' chalk-active-team' : ''}`}>{p.name}</span>
                    <span className="chalk-iar-status">
                      {isDone ? '—' : `${goesLeft}g`}
                    </span>
                  </div>
                  <div className="chalk-iar-scores">
                    <div className="chalk-iar-score-item">
                      <span className="chalk-iar-score-val">{hits[i]}</span>
                      <span className="chalk-iar-score-label">total</span>
                    </div>
                    <div className="chalk-iar-score-item">
                      <span className="chalk-iar-score-val">{bestGo[i]}</span>
                      <span className="chalk-iar-score-label">best</span>
                    </div>
                    {isActive && goHits[i] > 0 && (
                      <div className="chalk-iar-score-item">
                        <span className="chalk-iar-score-val chalk-iar-streak">{goHits[i]}</span>
                        <span className="chalk-iar-score-label">this go</span>
                      </div>
                    )}
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
