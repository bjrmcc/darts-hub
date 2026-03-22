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

const MAX_HISTORY = 6;

interface X01Snap {
  turn: TurnSnapshot;
  scores: number[];
  history: number[][];
  turnTotal: number;
  isBust: boolean;
  doubledIn: boolean[];
}

export default function X01GameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const variant: number = state?.variant ?? 501;
  const players: Profile[] = state?.players ?? [];
  const doubleIn: boolean = state?.doubleIn ?? false;
  const doubleOut: boolean = state?.doubleOut ?? false;

  const playerNames = players.map((p) => p.name);

  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [scores, setScores] = useState<number[]>(() => playerNames.map(() => variant));
  // history[i] = committed scores written on board for player i (oldest first)
  const [history, setHistory] = useState<number[][]>(() => playerNames.map(() => [variant]));
  const [turnTotal, setTurnTotal] = useState(0);
  const [isBust, setIsBust] = useState(false);
  const [doubledIn, setDoubledIn] = useState<boolean[]>(() => playerNames.map(() => !doubleIn));

  const { currentPlayerIndex, currentPlayer, nextPlayer, dartIndex, currentDarts, lastTurn, throwDart, throwMiss, snapshot, restore, getAllDarts } =
    useGameTurn(playerNames);

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  // Create session on mount, clean up on unmount
  useEffect(() => {
    startSession('x01', players.map((p) => p.id), {
      variant, playerNames, scores, currentPlayerIndex,
    }).then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state after each turn/dart change
  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (winner || !sessionStarted.current) return;
    pushState({ variant, playerNames, scores, currentPlayerIndex, dartIndex });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, currentPlayerIndex, dartIndex]);

  const snapshotsRef = useRef<X01Snap[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushSnapshot() {
    snapshotsRef.current.push({
      turn: snapshot(),
      scores: [...scores],
      history: history.map((h) => [...h]),
      turnTotal,
      isBust,
      doubledIn: [...doubledIn],
    });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    restore(prev.turn);
    setScores(prev.scores);
    setHistory(prev.history);
    setTurnTotal(prev.turnTotal);
    setIsBust(prev.isBust);
    setDoubledIn(prev.doubledIn);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  function commitTurn(scoredThisTurn: number, bust: boolean) {
    const pi = currentPlayerIndex;
    const scoreBeforeTurn = scores[pi];
    setScores((prev) => {
      const next = [...prev];
      if (!bust) next[pi] = prev[pi] - scoredThisTurn;
      return next;
    });
    if (!bust && scoredThisTurn > 0) {
      setHistory((prev) => {
        const next = prev.map((h) => [...h]);
        const newScore = scoreBeforeTurn - scoredThisTurn;
        next[pi] = [...next[pi], newScore];
        // Board is full — wipe and start fresh
        if (next[pi].length > MAX_HISTORY) next[pi] = [newScore];
        return next;
      });
    }
    setTurnTotal(0);
    setIsBust(false);
  }

  function handleHit(hit: DartHit) {
    pushSnapshot();
    const isLastDart = dartIndex === 2;
    const pi = currentPlayerIndex;
    const currentScore = scores[pi];

    // Double-in: hasn't opened yet
    if (!doubledIn[pi]) {
      if (hit.multiplier === 2) {
        const nd = [...doubledIn];
        nd[pi] = true;
        setDoubledIn(nd);
        // fall through — this dart counts
      } else {
        if (isLastDart) commitTurn(0, false);
        throwDart(hit);
        return;
      }
    }

    // Already bust this turn — burn remaining darts
    if (isBust) {
      if (isLastDart) commitTurn(0, true);
      throwDart(hit);
      return;
    }

    const newTurnTotal = turnTotal + hit.score;
    const remaining = currentScore - newTurnTotal;

    if (remaining < 0) {
      setIsBust(true);
      if (isLastDart) commitTurn(0, true);
      throwDart(hit);
      return;
    }

    if (remaining === 0) {
      if (doubleOut && hit.multiplier !== 2) {
        setIsBust(true);
        if (isLastDart) commitTurn(0, true);
      } else {
        // WIN
        const checkoutDarts = [...currentDarts, hit].map((d) => (d === 'miss' ? 'Miss' : d.label));
        const checkoutValue = currentScore;
        setScores((prev) => { const n = [...prev]; n[pi] = 0; return n; });
        throwDart(hit);
        const winnerId = players.find((p) => p.name === currentPlayer)?.id ?? '';
        const stats = buildGameStats(players, getAllDarts(), [winnerId]);
        const winnerStat = stats.players.find((p) => p.playerId === winnerId);
        if (winnerStat) winnerStat.checkout = { value: checkoutValue, darts: checkoutDarts };
        addResult({
          id: crypto.randomUUID(),
          gameMode: 'x01',
          players: players.map((p) => p.id),
          winnerId,
          date: Date.now(),
          stats,
        });
        setWinner(currentPlayer);
        return;
      }
    } else {
      setTurnTotal(newTurnTotal);
      if (isLastDart) commitTurn(newTurnTotal, false);
    }

    throwDart(hit);
  }

  function handleMiss() {
    pushSnapshot();
    const isLastDart = dartIndex === 2;
    if (isLastDart) commitTurn(turnTotal, isBust);
    throwMiss();
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
                    <button className="game-leave-confirm-btn" onClick={() => navigate(ROUTES.X01_SETUP, { state })}>Leave</button>
                    <button className="game-leave-cancel-btn" onClick={() => setConfirmLeave(false)}>Stay</button>
                  </>
                ) : (
                  <button className="game-back-btn" onClick={() => setConfirmLeave(true)}>← Setup</button>
                )}
                <button className="miss-btn full-miss-btn" onClick={handleMiss}>Miss</button>
                <button className="undo-btn" onClick={handleUndo} disabled={!canUndo}>Undo ↩</button>
              </>
            )}
          </div>
        </div>

        {/* Right: chalkboard */}
        <div className="chalkboard">
          <div className="chalk-x01-players">
            {playerNames.map((name, i) => {
              const isActive = i === currentPlayerIndex;
              const hist = history[i];
              const committedScore = scores[i];
              const showLive = isActive && turnTotal > 0 && !isBust;
              const showBust = isActive && isBust;
              const liveScore = committedScore - turnTotal;

              return (
                <div key={i} className={`chalk-x01-player ${isActive ? 'chalk-x01-active' : ''}`}>
                  <span className={`chalk-team-name ${isActive ? 'chalk-active-team' : ''}`}>
                    {name}
                  </span>
                  <div className="chalk-x01-scores">
                    {/* All historical entries except the current — struck through */}
                    {hist.slice(0, -1).map((s, j) => (
                      <span key={j} className="chalk-x01-prev">{s}</span>
                    ))}
                    {/* Current entry: crossed out if live scoring, big if not */}
                    {showLive ? (
                      <>
                        <span className="chalk-x01-prev">{hist[hist.length - 1]}</span>
                        <span className="chalk-x01-score">{liveScore}</span>
                      </>
                    ) : (
                      <span className={`chalk-x01-score${showBust ? ' chalk-x01-score--bust' : ''}`}>
                        {hist[hist.length - 1]}
                      </span>
                    )}
                    {showBust && <span className="chalk-x01-bust-label">BUST</span>}
                  </div>
                  {doubleIn && !doubledIn[i] && (
                    <span className="chalk-x01-hint">needs double to open</span>
                  )}
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
