import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import SlidingPages from '../../components/shared/SlidingPages';
import MiniModeLeaderboard from '../../components/shared/MiniModeLeaderboard';
import DataLoading from '../../components/shared/DataLoading';
import type { GameStats, PlayerDartStats, GameResult } from '../../types';

type FilterKey = '5' | 'week' | 'month' | 'custom';

interface FTStats {
  bestNumber: number | null;
  bestNumberMpv: number | null;
  mpv: number | null;
  d1Mpv: number | null;
  d2Mpv: number | null;
  d3Mpv: number | null;
  treblePct: number | null;
  doublePct: number | null;
  hitPct: number | null;
  sessionsPlayed: number;
  totalDarts: number;
  totalVisits: number;
}

function applyFilter(games: GameResult[], filter: FilterKey, from: string, to: string): GameResult[] {
  const now = Date.now();
  if (filter === '5') return games.slice(0, 5);
  if (filter === 'week') return games.filter(g => g.date >= now - 7 * 86400000);
  if (filter === 'month') return games.filter(g => g.date >= now - 30 * 86400000);
  if (filter === 'custom') {
    const f = from ? new Date(from).getTime() : 0;
    const t = to ? new Date(to).getTime() + 86399999 : Infinity;
    return games.filter(g => g.date >= f && g.date <= t);
  }
  return games;
}

function computeStats(
  history: GameResult[],
  profileId: string,
  filter: FilterKey,
  customFrom: string,
  customTo: string,
  includeBull: boolean,
): FTStats {
  const empty: FTStats = {
    bestNumber: null, bestNumberMpv: null,
    mpv: null, d1Mpv: null, d2Mpv: null, d3Mpv: null,
    treblePct: null, doublePct: null, hitPct: null,
    sessionsPlayed: 0, totalDarts: 0, totalVisits: 0,
  };

  let games = history.filter(g => g.gameMode === 'firstTo');
  games = applyFilter(games, filter, customFrom, customTo);
  if (!includeBull) games = games.filter(g => (g.meta?.targetNumber as number | undefined) !== 25);

  type Entry = { game: GameResult; rec: PlayerDartStats };
  const entries: Entry[] = games
    .map(g => {
      const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
      return rec ? { game: g, rec } : null;
    })
    .filter((x): x is Entry => x !== null);

  if (!entries.length) return empty;

  let totalMarks = 0, totalVisits = 0, totalDarts = 0;
  let totalTrebles = 0, totalDoubles = 0, totalHits = 0;
  let d1Marks = 0, d2Marks = 0, d3Marks = 0;

  // Per-number accumulator for best number
  const numMap = new Map<number, { marks: number; visits: number }>();

  for (const { game, rec } of entries) {
    const target = game.meta?.targetNumber as number | undefined;
    const visits = rec.d1.length;
    totalVisits += visits;
    totalDarts += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;

    if (target !== undefined) {
      if (!numMap.has(target)) numMap.set(target, { marks: 0, visits: 0 });
      numMap.get(target)!.visits += visits;
    }

    for (let i = 0; i < visits; i++) {
      const dartPos: [number, number, number][] = [
        [rec.d1[i] ?? 0, (rec.d1m ?? [])[i] ?? 0, 1],
        [rec.d2[i] ?? 0, (rec.d2m ?? [])[i] ?? 0, 2],
        [rec.d3[i] ?? 0, (rec.d3m ?? [])[i] ?? 0, 3],
      ];
      for (const [score, mult, pos] of dartPos) {
        if (mult === 3) totalTrebles++;
        if (mult === 2) totalDoubles++;
        if (mult > 0 && target !== undefined) {
          const base = Math.round(score / mult);
          if (base === target) {
            totalHits++;
            totalMarks += mult;
            if (pos === 1) d1Marks += mult;
            else if (pos === 2) d2Marks += mult;
            else d3Marks += mult;
            numMap.get(target)!.marks += mult;
          }
        }
      }
    }
  }

  let bestNumber: number | null = null;
  let bestNumberMpv: number | null = null;
  for (const [num, { marks, visits }] of numMap) {
    const mpv = visits > 0 ? marks / visits : 0;
    if (bestNumberMpv === null || mpv > bestNumberMpv) {
      bestNumberMpv = mpv;
      bestNumber = num;
    }
  }

  return {
    bestNumber,
    bestNumberMpv,
    mpv: totalVisits > 0 ? totalMarks / totalVisits : null,
    d1Mpv: totalVisits > 0 ? d1Marks / totalVisits : null,
    d2Mpv: totalVisits > 0 ? d2Marks / totalVisits : null,
    d3Mpv: totalVisits > 0 ? d3Marks / totalVisits : null,
    treblePct: totalDarts > 0 ? (totalTrebles / totalDarts) * 100 : null,
    doublePct: totalDarts > 0 ? (totalDoubles / totalDarts) * 100 : null,
    hitPct: totalDarts > 0 ? (totalHits / totalDarts) * 100 : null,
    sessionsPlayed: entries.length,
    totalDarts,
    totalVisits,
  };
}

const FILTERS: [FilterKey, string][] = [
  ['5', 'Last 5'], ['week', 'Last Week'], ['month', 'Last Month'], ['custom', 'Custom'],
];

export default function FirstToStatsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore(s => s.history);
  const statsLoaded = useStatisticsStore(s => s.loaded);
  const { activeProfileId } = useProfilesStore();
  const [filter, setFilter] = useState<FilterKey>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [includeBull, setIncludeBull] = useState(true);
  const loc = useLocation();
  const [page, setPage] = useState((loc.state as { leaderboard?: boolean } | null)?.leaderboard ? 1 : 0);

  const s = activeProfileId
    ? computeStats(history, activeProfileId, filter, customFrom, customTo, includeBull)
    : null;

  const f2 = (v: number | null) => v !== null ? v.toFixed(2) : '—';
  const fPct = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="ss-page">

      <div className="ss-screen-header ss-screen-header--ft">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">{page === 0 ? 'First To Stats' : 'First To Leaderboard'}</span>
      </div>

      <SlidingPages accentClass="sliding-dot--ft" onPageChange={setPage} initialPage={page}>
        <>{/* ── Stats page ── */}

      <div className="ss-filters-grid">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`ss-pill${filter === k ? ' ss-pill--active ss-pill--ft' : ''}`}
            onClick={() => setFilter(k)}
          >{label}</button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="ss-date-range">
          <input type="date" className="ss-date-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          <span className="ss-date-sep">to</span>
          <input type="date" className="ss-date-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="ss-bull-toggle">
        <span className="ss-bull-toggle-label">Include Bull (25)</span>
        <label className="ss-toggle">
          <input type="checkbox" checked={includeBull} onChange={e => setIncludeBull(e.target.checked)} />
          <span className="ss-toggle-slider" />
        </label>
      </div>

      {s && s.sessionsPlayed > 0 && (
        <div className="ss-summary">
          <span>{s.sessionsPlayed} session{s.sessionsPlayed !== 1 ? 's' : ''}</span>
          <span className="ss-dot">·</span>
          <span>{s.totalDarts.toLocaleString()} darts</span>
          <span className="ss-dot">·</span>
          <span>{s.totalVisits.toLocaleString()} visits</span>
        </div>
      )}

      {!statsLoaded ? (
        <DataLoading />
      ) : !s || s.sessionsPlayed === 0 ? (
        <div className="ss-empty">No First To games recorded for this period</div>
      ) : (
        <div className="ss-body">

          {s.bestNumber !== null && (
            <div className="ss-ft-best">
              <span className="ss-ft-best-label">Best Number</span>
              <span className="ss-ft-best-num ss-val--ft">
                {s.bestNumber === 25 ? 'Bull' : s.bestNumber}
              </span>
              <span className="ss-ft-best-mpv">{f2(s.bestNumberMpv)} MPV</span>
            </div>
          )}

          <div className="ss-hero ss-hero--ft">
            <span className="ss-hero-label">Marks Per Visit</span>
            <span className="ss-hero-value">{f2(s.mpv)}</span>
          </div>

          <div className="ss-section-title">Marks per Visit by Dart Position</div>
          <div className="ss-3cards">
            <div className="ss-card">
              <span className="ss-card-label">1st Dart</span>
              <span className="ss-card-value ss-val--ft">{f2(s.d1Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">2nd Dart</span>
              <span className="ss-card-value ss-val--ft">{f2(s.d2Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">3rd Dart</span>
              <span className="ss-card-value ss-val--ft">{f2(s.d3Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
          </div>

          <div className="ss-cards">
            <div className="ss-card">
              <span className="ss-card-label">Treble %</span>
              <span className="ss-card-value">{fPct(s.treblePct)}</span>
              <span className="ss-card-sub">of all darts</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">Double %</span>
              <span className="ss-card-value">{fPct(s.doublePct)}</span>
              <span className="ss-card-sub">of all darts</span>
            </div>
          </div>

          <div className="ss-cards">
            <div className="ss-card ss-card--wide">
              <span className="ss-card-label">Hit %</span>
              <span className="ss-card-value ss-val--ft">{fPct(s.hitPct)}</span>
              <span className="ss-card-sub">darts landing on target number</span>
            </div>
          </div>

          <div className="ss-elo-card ss-elo-card--ft">
            <div className="ss-elo-left">
              <span className="ss-elo-eyebrow">ELO Rating</span>
              <span className="ss-elo-val">N/A</span>
              <span className="ss-elo-sub">tracking coming soon</span>
            </div>
            <div className="ss-elo-chart">
              <svg viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="eloGradFt" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.18" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="164" height="40" rx="4" fill="url(#eloGradFt)" />
                <line x1="8" y1="36" x2="172" y2="36" stroke="#2a2010" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="44" cy="36" r="2.5" fill="#2a1e0e" />
                <circle cx="78" cy="36" r="2.5" fill="#2a1e0e" />
                <circle cx="112" cy="36" r="2.5" fill="#2a1e0e" />
                <circle cx="146" cy="36" r="2.5" fill="#2a1e0e" />
                <text x="90" y="23" textAnchor="middle" fill="#302810" fontSize="8.5" fontFamily="inherit" letterSpacing="0.04em">ELO HISTORY</text>
              </svg>
            </div>
          </div>

        </div>
      )}
        </>{/* ── Leaderboard page (coming soon) ── */}
        <MiniModeLeaderboard mode="firstTo" />
      </SlidingPages>
    </div>
  );
}
