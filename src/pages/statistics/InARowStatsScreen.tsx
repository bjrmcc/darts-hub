import { useState } from 'react';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import DataLoading from '../../components/shared/DataLoading';
import type { GameStats, GameResult } from '../../types';

type Filter = '5' | 'month' | 'all';

const FILTERS: [Filter, string][] = [
  ['5', 'Last 5'],
  ['month', 'Last Month'],
  ['all', 'All Time'],
];

interface PlayerHitEntry { playerId: string; hits: number; }

export default function InARowStatsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore((s) => s.history);
  const statsLoaded = useStatisticsStore((s) => s.loaded);
  const { activeProfileId } = useProfilesStore();
  const [filter, setFilter] = useState<Filter>('all');

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  let games = history.filter((g: GameResult) => g.gameMode === 'inARow');
  if (filter === '5') games = games.slice(0, 5);
  if (filter === 'month') games = games.filter((g) => g.date >= now - 30 * 86400000);

  const myGames = games.filter((g) => g.players.includes(activeProfileId ?? ''));

  // Score stats from meta.playerHits
  const myScores = myGames
    .map((g) => {
      const entry = (g.meta?.playerHits as PlayerHitEntry[] | undefined)?.find(
        (e) => e.playerId === activeProfileId
      );
      return entry?.hits ?? 0;
    });

  const gamesPlayed = myGames.length;
  const wins = myGames.filter((g) => g.winnerId === activeProfileId).length;
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : null;
  const bestScore = myScores.length > 0 ? Math.max(...myScores) : null;
  const avgScore = myScores.length > 0 ? myScores.reduce((a, b) => a + b, 0) / myScores.length : null;

  // Hit rate from dart stats
  const records = myGames
    .flatMap((g) => (g.stats as GameStats).players)
    .filter((p) => p.playerId === activeProfileId);

  const d1m = records.flatMap((r) => r.d1m ?? []);
  const d2m = records.flatMap((r) => r.d2m ?? []);
  const d3m = records.flatMap((r) => r.d3m ?? []);
  const totalDarts = d1m.length + d2m.length + d3m.length;
  const totalHits = [...d1m, ...d2m, ...d3m].filter((m) => m > 0).length;
  const hitRate = totalDarts > 0 ? (totalHits / totalDarts) * 100 : null;

  const hasData = gamesPlayed > 0;
  const fmt1 = (v: number | null) => v !== null ? v.toFixed(1) : '—';
  const fmtPct = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="prac-page">

      <div className="prac-filters">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`prac-filter-btn${filter === k ? ' prac-filter-btn--active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {!statsLoaded ? (
        <DataLoading />
      ) : !hasData ? (
        <div className="prac-empty">No In a Row games recorded yet</div>
      ) : (
        <div className="prac-body">

          <div className="prac-hero">
            <div className="prac-hero-inner">
              <span className="prac-hero-label">Games Played</span>
              <span className="prac-hero-value">{gamesPlayed}</span>
              <span className="prac-hero-sub">{wins} win{wins !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="prac-row">
            <div className="prac-card">
              <span className="prac-card-label">Win Rate</span>
              <span className="prac-card-value prac-card-value--red">{fmtPct(winRate)}</span>
            </div>
            <div className="prac-card">
              <span className="prac-card-label">Hit Rate</span>
              <span className="prac-card-value prac-card-value--blue">{fmtPct(hitRate)}</span>
              <span className="prac-card-sub">darts on target</span>
            </div>
          </div>

          <div className="prac-row">
            <div className="prac-card">
              <span className="prac-card-label">Best Score</span>
              <span className="prac-card-value">{bestScore ?? '—'}</span>
              <span className="prac-card-sub">hits in a game</span>
            </div>
            <div className="prac-card">
              <span className="prac-card-label">Avg Score</span>
              <span className="prac-card-value">{fmt1(avgScore)}</span>
              <span className="prac-card-sub">hits per game</span>
            </div>
          </div>

        </div>
      )}

      <button className="secondary prac-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>Back</button>
    </div>
  );
}
