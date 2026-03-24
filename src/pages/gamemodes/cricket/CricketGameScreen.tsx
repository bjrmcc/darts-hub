import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameTurn, type TurnSnapshot } from '../../../hooks/useGameTurn';
import GameBoard, { type DartHit } from '../../../components/dartboard/GameBoard';
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';
import WinOverlay from '../../../components/shared/WinOverlay';
import { useStatisticsStore } from '../../../store/statisticsStore';
import { buildGameStats } from '../../../utils/buildGameStats';
import { useGameSessionStore } from '../../../store/gameSessionStore';
import { cpuProfileFromDifficulty, simulateDart, aimCricket } from '../../../utils/cpuPlayer';
import { useCpuTurn } from '../../../hooks/useCpuTurn';

const CRICKET_NUMS = [20, 19, 18, 17, 16, 15, 25] as const;
type CricketNum = (typeof CRICKET_NUMS)[number];

interface NumberState { team1: number; team2: number; }
interface CricketState {
  marks: Record<CricketNum, NumberState>;
  score: { team1: number; team2: number };
}

interface Snap { turn: TurnSnapshot; cricket: CricketState; }

function initState(): CricketState {
  const marks = {} as Record<CricketNum, NumberState>;
  CRICKET_NUMS.forEach((n) => { marks[n] = { team1: 0, team2: 0 }; });
  return { marks, score: { team1: 0, team2: 0 } };
}

function applyHit(
  state: CricketState,
  number: number,
  multiplier: 1 | 2 | 3,
  team: 'team1' | 'team2',
): CricketState {
  if (!CRICKET_NUMS.includes(number as CricketNum)) return state;
  const n = number as CricketNum;
  const opp = team === 'team1' ? 'team2' : 'team1';
  const cur = state.marks[n][team];
  const oppMarks = state.marks[n][opp];

  if (cur >= 3 && oppMarks >= 3) return state; // fully closed

  const raw = cur + multiplier;
  const capped = Math.min(3, raw);

  const scoringHits = oppMarks < 3 && cur >= 3 ? multiplier : 0;

  const pointsPerHit = n === 25 ? 25 : n;
  const points = scoringHits * pointsPerHit;

  return {
    marks: { ...state.marks, [n]: { ...state.marks[n], [team]: capped } },
    score: { ...state.score, [team]: state.score[team] + points },
  };
}

function isClosed(state: CricketState, n: CricketNum) {
  return state.marks[n].team1 >= 3 && state.marks[n].team2 >= 3;
}

function isOpen(state: CricketState, n: CricketNum, team: 'team1' | 'team2') {
  const opp = team === 'team1' ? 'team2' : 'team1';
  return state.marks[n][team] >= 3 && state.marks[n][opp] < 3;
}

// ── Chalk marks component ───────────────────────────────────
function ChalkMarks({ count, flipped }: { count: number; flipped?: boolean }) {
  if (count === 0) return <span className="chalk-empty">·</span>;
  const mark =
    count === 1 ? '/' :
    count === 2 ? 'X' :
    '⊗';
  return <span className={`chalk-mark chalk-mark-${count} ${flipped ? 'flipped' : ''}`}>{mark}</span>;
}

export default function CricketGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mode: string = state?.mode ?? 'players';
  const difficulty: number = state?.difficulty ?? 15;

  const CPU_PLAYER: Profile = useMemo(() => ({ id: 'cpu', name: 'CPU', createdAt: 0 }), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const team1: Profile[] = useMemo(() => state?.team1 ?? [], []);
  const team2: Profile[] = useMemo(() => {
    const base: Profile[] = state?.team2 ?? [];
    return mode === 'cpu' ? [...base, CPU_PLAYER] : base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cpuProfile = useMemo(() => cpuProfileFromDifficulty(difficulty), [difficulty]);

  const maxLen = Math.max(team1.length, team2.length);
  const playerNames: string[] = [];
  const playerTeams: ('team1' | 'team2')[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (team1[i]) { playerNames.push(team1[i].name); playerTeams.push('team1'); }
    if (team2[i]) { playerNames.push(team2[i].name); playerTeams.push('team2'); }
  }

  const [cricket, setCricket] = useState<CricketState>(initState);
  const [winner, setWinner] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { currentPlayerIndex, currentPlayer, nextPlayer, dartIndex, lastTurn, throwDart, throwMiss, snapshot, restore, getAllDarts } =
    useGameTurn(playerNames);

  const addResult = useStatisticsStore((s) => s.addResult);
  const { startSession, pushState, endSession } = useGameSessionStore();
  const sessionStarted = useRef(false);
  const isFirstSync = useRef(true);

  const allPlayerIds = [...team1, ...team2].map((p) => p.id);
  useEffect(() => {
    startSession('cricket', allPlayerIds, { cricket, currentPlayerIndex, playerNames })
      .then(() => { sessionStarted.current = true; });
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    if (winner || !sessionStarted.current) return;
    pushState({ cricket, currentPlayerIndex, dartIndex, playerNames });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cricket, currentPlayerIndex, dartIndex]);

  const snapshotsRef = useRef<Snap[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const currentTeam = playerTeams[currentPlayerIndex] ?? 'team1';
  const team1Label = team1.length ? team1.map((p) => p.name).join(' & ') : 'Team 1';
  const team2Label = team2.length ? team2.map((p) => p.name).join(' & ') : 'Team 2';

  function pushSnapshot(cricketState: CricketState) {
    snapshotsRef.current.push({ turn: snapshot(), cricket: cricketState });
    setCanUndo(true);
  }

  function handleUndo() {
    const prev = snapshotsRef.current.pop();
    if (!prev) return;
    restore(prev.turn);
    setCricket(prev.cricket);
    setCanUndo(snapshotsRef.current.length > 0);
  }

  function handleHit(hit: DartHit) {
    pushSnapshot(cricket);
    const newCricket = applyHit(cricket, hit.number, hit.multiplier, currentTeam);
    setCricket(newCricket);
    throwDart(hit);
    const opp = currentTeam === 'team1' ? 'team2' : 'team1';
    const allClosed = CRICKET_NUMS.every((n) => newCricket.marks[n][currentTeam] >= 3);
    if (allClosed && newCricket.score[currentTeam] >= newCricket.score[opp]) {
      const winningTeamPlayers = currentTeam === 'team1' ? team1 : team2;
      const allPlayers = [...team1, ...team2];
      const winnerIds = winningTeamPlayers.map((p) => p.id);
      addResult({
        id: crypto.randomUUID(),
        gameMode: 'cricket',
        players: allPlayers.map((p) => p.id),
        winnerId: winnerIds[0],
        date: Date.now(),
        stats: buildGameStats(allPlayers, getAllDarts(), winnerIds),
      });
      setWinner(currentTeam === 'team1' ? team1Label : team2Label);
    }
  }

  function handleMiss() {
    pushSnapshot(cricket);
    throwMiss();
  }

  const isCpuTurn = mode === 'cpu' && currentTeam === 'team2' && !winner;
  useCpuTurn(isCpuTurn, dartIndex, () => {
    const aim = aimCricket(cricket.marks, 'team2');
    const result = simulateDart(aim, cpuProfile);
    if (result === 'miss') handleMiss();
    else handleHit(result);
  }, cpuProfile.dartDelayMs);

  return (
    <div className="cricket-screen">
      <div className="cricket-main">

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
                    <button className="game-leave-confirm-btn" onClick={() => navigate(ROUTES.CRICKET_SETUP, { state })}>Leave</button>
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

        <div className="chalkboard">
          <div className="chalk-header">
            <span className={`chalk-team-name ${currentTeam === 'team1' ? 'chalk-active-team' : ''}`}>
              {team1Label}
            </span>
            <span className="chalk-divider" />
            <span className={`chalk-team-name ${currentTeam === 'team2' ? 'chalk-active-team' : ''}`}>
              {team2Label}
            </span>
          </div>

          <div className="chalk-rule" />

          {CRICKET_NUMS.map((n) => {
            const closed = isClosed(cricket, n);
            const t1Open = isOpen(cricket, n, 'team1');
            const t2Open = isOpen(cricket, n, 'team2');
            return (
              <div key={n} className={`chalk-row ${closed ? 'chalk-row-closed' : ''}`}>
                <div className={`chalk-marks-cell ${t1Open ? 'chalk-open' : ''}`}>
                  <ChalkMarks count={cricket.marks[n].team1} />
                </div>
                <div className="chalk-number-cell">
                  <span className={`chalk-number ${closed ? 'chalk-number-closed' : ''}`}>
                    {n === 25 ? 'Bull' : n}
                  </span>
                </div>
                <div className={`chalk-marks-cell ${t2Open ? 'chalk-open' : ''}`}>
                  <ChalkMarks count={cricket.marks[n].team2} flipped />
                </div>
              </div>
            );
          })}

          <div className="chalk-rule" />

          <div className="chalk-scores">
            <span className="chalk-score-num">{cricket.score.team1}</span>
            <span className="chalk-score-divider">·</span>
            <span className="chalk-score-num">{cricket.score.team2}</span>
          </div>

        </div>
      </div>

      {winner && !viewing && (
        <WinOverlay winner={winner} onHome={() => navigate(ROUTES.HOME)} onView={() => setViewing(true)} />
      )}
    </div>
  );
}
