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

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

interface X01Stats {
  threeDartAvg: number | null;
  checkoutDoublePct: number | null;
  dartsPerLeg: number | null;
  tons: number;
  bigTons: number;
  maxes: number;
  checkouts: { value: number; darts: string[]; date: number }[];
  legsPlayed: number;
  totalDarts: number;
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
): X01Stats {
  const empty: X01Stats = {
    threeDartAvg: null, checkoutDoublePct: null, dartsPerLeg: null,
    tons: 0, bigTons: 0, maxes: 0, checkouts: [], legsPlayed: 0, totalDarts: 0,
  };

  let games = history.filter(g => g.gameMode === 'x01');
  games = applyFilter(games, filter, customFrom, customTo);

  type Entry = { game: GameResult; rec: PlayerDartStats };
  const entries: Entry[] = games
    .map(g => {
      const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
      return rec ? { game: g, rec } : null;
    })
    .filter((x): x is Entry => x !== null);

  if (!entries.length) return empty;

  let totalScore = 0, totalTurns = 0, totalDarts = 0;
  let tons = 0, bigTons = 0, maxes = 0;

  for (const { rec } of entries) {
    const allMults = [...(rec.d1m ?? []), ...(rec.d2m ?? []), ...(rec.d3m ?? [])];
    totalDarts += allMults.length;
    for (let i = 0; i < rec.d1.length; i++) {
      const t = (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
      totalScore += t;
      totalTurns++;
      if (t >= 100 && t < 140) tons++;
      else if (t >= 140 && t < 180) bigTons++;
      else if (t === 180) maxes++;
    }
  }

  // Checkout double %: % of checkout darts that are doubles
  let coDarts = 0, coDoubles = 0;
  for (const { rec } of entries) {
    if (rec.won && rec.checkout) {
      for (const dart of rec.checkout.darts) {
        coDarts++;
        if (dart.startsWith('D')) coDoubles++;
      }
    }
  }

  const dartsArr = entries
    .filter(({ rec }) => rec.won && rec.checkout)
    .map(({ rec }) => 3 * (rec.d1.length - 1) + rec.checkout!.darts.length);

  const checkouts = entries
    .filter(({ rec }) => rec.won && rec.checkout)
    .map(({ rec, game }) => ({ value: rec.checkout!.value, darts: rec.checkout!.darts, date: game.date }))
    .sort((a, b) => b.value - a.value);

  return {
    threeDartAvg: totalTurns > 0 ? totalScore / totalTurns : null,
    checkoutDoublePct: coDarts > 0 ? (coDoubles / coDarts) * 100 : null,
    dartsPerLeg: dartsArr.length > 0 ? dartsArr.reduce((a, b) => a + b, 0) / dartsArr.length : null,
    tons, bigTons, maxes, checkouts,
    legsPlayed: entries.length,
    totalDarts,
  };
}

const FILTERS: [FilterKey, string][] = [
  ['5', 'Last 5'], ['week', 'Last Week'], ['month', 'Last Month'], ['custom', 'Custom'],
];

export default function X01StatsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore(s => s.history);
  const statsLoaded = useStatisticsStore(s => s.loaded);
  const { activeProfileId } = useProfilesStore();
  const [filter, setFilter] = useState<FilterKey>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const loc = useLocation();
  const [page, setPage] = useState((loc.state as { leaderboard?: boolean } | null)?.leaderboard ? 1 : 0);

  const s = activeProfileId ? computeStats(history, activeProfileId, filter, customFrom, customTo) : null;
  const f1 = (v: number | null) => v !== null ? v.toFixed(1) : '—';
  const f2 = (v: number | null) => v !== null ? v.toFixed(2) : '—';
  const fPct = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="ss-page">

      <div className="ss-screen-header ss-screen-header--x01">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">{page === 0 ? 'X01 Stats' : 'X01 Leaderboard'}</span>
      </div>

      <SlidingPages accentClass="sliding-dot--x01" onPageChange={setPage} initialPage={page}>
        <>{/* ── Stats page ── */}

      <div className="ss-filters-grid">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`ss-pill${filter === k ? ' ss-pill--active ss-pill--x01' : ''}`}
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

      {s && s.legsPlayed > 0 && (
        <div className="ss-summary">
          <span>{s.legsPlayed} leg{s.legsPlayed !== 1 ? 's' : ''}</span>
          <span className="ss-dot">·</span>
          <span>{s.totalDarts.toLocaleString()} darts</span>
        </div>
      )}

      {!statsLoaded ? (
        <DataLoading />
      ) : !s || s.legsPlayed === 0 ? (
        <div className="ss-empty">No X01 legs recorded for this period</div>
      ) : (
        <div className="ss-body">

          <div className="ss-hero ss-hero--x01">
            <span className="ss-hero-label">3-Dart Average</span>
            <span className="ss-hero-value">{f2(s.threeDartAvg)}</span>
          </div>

          <div className="ss-cards">
            <div className="ss-card">
              <span className="ss-card-label">Darts per Leg</span>
              <span className="ss-card-value">{f1(s.dartsPerLeg)}</span>
              <span className="ss-card-sub">avg to finish</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">Checkout Double %</span>
              <span className="ss-card-value ss-val--x01">{fPct(s.checkoutDoublePct)}</span>
              <span className="ss-card-sub">of checkout darts</span>
            </div>
          </div>

          <div className="ss-section-title">Scoring Power</div>
          <div className="ss-badges">
            <div className="ss-badge">
              <span className="ss-badge-val">{s.tons}</span>
              <span className="ss-badge-label">Ton+</span>
              <span className="ss-badge-range">100–139</span>
            </div>
            <div className="ss-badge ss-badge--amber">
              <span className="ss-badge-val">{s.bigTons}</span>
              <span className="ss-badge-label">Big Ton</span>
              <span className="ss-badge-range">140–179</span>
            </div>
            <div className="ss-badge ss-badge--red">
              <span className="ss-badge-val">{s.maxes}</span>
              <span className="ss-badge-label">Maximum</span>
              <span className="ss-badge-range">180</span>
            </div>
          </div>

          {s.checkouts.length > 0 && (
            <div className="ss-table-card">
              <div className="ss-table-title">Highest Checkouts</div>
              <div className="ss-co-grid ss-co-grid--head">
                <span>Score</span><span>Darts</span><span>Date</span>
              </div>
              {s.checkouts.slice(0, 10).map((co, i) => (
                <div key={i} className="ss-co-grid">
                  <span className="ss-co-score ss-val--x01">{co.value}</span>
                  <span className="ss-co-darts">{co.darts.join(' · ')}</span>
                  <span className="ss-co-date">{fmtDate(co.date)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ss-elo-card ss-elo-card--x01">
            <div className="ss-elo-left">
              <span className="ss-elo-eyebrow">ELO Rating</span>
              <span className="ss-elo-val">N/A</span>
              <span className="ss-elo-sub">tracking coming soon</span>
            </div>
            <div className="ss-elo-chart">
              <svg viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="eloGradX01" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c0392b" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#c0392b" stopOpacity="0.22" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="164" height="40" rx="4" fill="url(#eloGradX01)" />
                <line x1="8" y1="36" x2="172" y2="36" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="44" cy="36" r="2.5" fill="#3a1a1a" />
                <circle cx="78" cy="36" r="2.5" fill="#3a1a1a" />
                <circle cx="112" cy="36" r="2.5" fill="#3a1a1a" />
                <circle cx="146" cy="36" r="2.5" fill="#3a1a1a" />
                <text x="90" y="23" textAnchor="middle" fill="#3d3030" fontSize="8.5" fontFamily="inherit" letterSpacing="0.04em">ELO HISTORY</text>
              </svg>
            </div>
          </div>

        </div>
      )}
        </>{/* ── Leaderboard page (coming soon) ── */}
        <MiniModeLeaderboard mode="x01" />
      </SlidingPages>
    </div>
  );
}
