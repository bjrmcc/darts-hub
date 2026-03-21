import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { useGoto } from '../../hooks/useGoto';
import { CRICKET_NUMBERS, ROUTES } from '../../constants';
import SlidingPages from '../../components/shared/SlidingPages';
import MiniModeLeaderboard from '../../components/shared/MiniModeLeaderboard';
import type { GameStats, PlayerDartStats, GameResult } from '../../types';

type FilterKey = '5' | 'week' | 'month' | 'custom';

const CRICKET_NUMS = [20, 19, 18, 17, 16, 15, 25];
const CRICKET_SET = new Set<number>([...CRICKET_NUMBERS]);

interface NumStat {
  number: number;
  marks: number;
  m1: number;
  m2: number;
  m3: number;
  singles: number;
  doubles: number;
  trebles: number;
}

interface CricketStats {
  mpv: number | null;
  d1Mpv: number | null;
  d2Mpv: number | null;
  d3Mpv: number | null;
  treblePct: number | null;
  doublePct: number | null;
  hitPct: number | null;
  gamesPlayed: number;
  totalDarts: number;
  totalVisits: number;
  numStats: NumStat[];
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
): CricketStats {
  const emptyNums: NumStat[] = CRICKET_NUMS.map(n => ({
    number: n, marks: 0, m1: 0, m2: 0, m3: 0, singles: 0, doubles: 0, trebles: 0,
  }));
  const empty: CricketStats = {
    mpv: null, d1Mpv: null, d2Mpv: null, d3Mpv: null,
    treblePct: null, doublePct: null, hitPct: null,
    gamesPlayed: 0, totalDarts: 0, totalVisits: 0, numStats: emptyNums,
  };

  let games = history.filter(g => g.gameMode === 'cricket');
  games = applyFilter(games, filter, customFrom, customTo);

  type Entry = { rec: PlayerDartStats };
  const entries: Entry[] = games
    .map(g => {
      const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
      return rec ? { rec } : null;
    })
    .filter((x): x is Entry => x !== null);

  if (!entries.length) return empty;

  let totalMarks = 0, totalVisits = 0, totalDarts = 0;
  let totalTrebles = 0, totalDoubles = 0, totalCricketHits = 0;
  let d1TotalMarks = 0, d2TotalMarks = 0, d3TotalMarks = 0;

  const numMap = new Map<number, NumStat>(
    CRICKET_NUMS.map(n => [n, { number: n, marks: 0, m1: 0, m2: 0, m3: 0, singles: 0, doubles: 0, trebles: 0 }]),
  );

  for (const { rec } of entries) {
    const visits = rec.d1.length;
    totalVisits += visits;
    totalDarts += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;

    for (let i = 0; i < visits; i++) {
      const dartPos: [number, number, 1 | 2 | 3][] = [
        [rec.d1[i] ?? 0, (rec.d1m ?? [])[i] ?? 0, 1],
        [rec.d2[i] ?? 0, (rec.d2m ?? [])[i] ?? 0, 2],
        [rec.d3[i] ?? 0, (rec.d3m ?? [])[i] ?? 0, 3],
      ];
      for (const [score, mult, pos] of dartPos) {
        if (mult === 3) totalTrebles++;
        if (mult === 2) totalDoubles++;
        if (mult > 0) {
          const base = Math.round(score / mult);
          if (CRICKET_SET.has(base) && (includeBull || base !== 25)) {
            totalCricketHits++;
            totalMarks += mult;
            if (pos === 1) d1TotalMarks += mult;
            else if (pos === 2) d2TotalMarks += mult;
            else d3TotalMarks += mult;
            const ns = numMap.get(base);
            if (ns) {
              ns.marks += mult;
              if (pos === 1) ns.m1 += mult;
              else if (pos === 2) ns.m2 += mult;
              else ns.m3 += mult;
              if (mult === 1) ns.singles++;
              else if (mult === 2) ns.doubles++;
              else if (mult === 3) ns.trebles++;
            }
          }
        }
      }
    }
  }

  return {
    mpv: totalVisits > 0 ? totalMarks / totalVisits : null,
    d1Mpv: totalVisits > 0 ? d1TotalMarks / totalVisits : null,
    d2Mpv: totalVisits > 0 ? d2TotalMarks / totalVisits : null,
    d3Mpv: totalVisits > 0 ? d3TotalMarks / totalVisits : null,
    treblePct: totalDarts > 0 ? (totalTrebles / totalDarts) * 100 : null,
    doublePct: totalDarts > 0 ? (totalDoubles / totalDarts) * 100 : null,
    hitPct: totalDarts > 0 ? (totalCricketHits / totalDarts) * 100 : null,
    gamesPlayed: entries.length,
    totalDarts,
    totalVisits,
    numStats: Array.from(numMap.values()),
  };
}

const FILTERS: [FilterKey, string][] = [
  ['5', 'Last 5'], ['week', 'Last Week'], ['month', 'Last Month'], ['custom', 'Custom'],
];

export default function CricketStatsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore(s => s.history);
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

      <div className="ss-screen-header ss-screen-header--crk">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">{page === 0 ? 'Cricket Stats' : 'Cricket Leaderboard'}</span>
      </div>

      <SlidingPages accentClass="sliding-dot--crk" onPageChange={setPage} initialPage={page}>
        <>{/* ── Stats page ── */}

      <div className="ss-filters-grid">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`ss-pill${filter === k ? ' ss-pill--active ss-pill--crk' : ''}`}
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

      {s && s.gamesPlayed > 0 && (
        <div className="ss-summary">
          <span>{s.gamesPlayed} game{s.gamesPlayed !== 1 ? 's' : ''}</span>
          <span className="ss-dot">·</span>
          <span>{s.totalDarts.toLocaleString()} darts</span>
          <span className="ss-dot">·</span>
          <span>{s.totalVisits.toLocaleString()} visits</span>
        </div>
      )}

      {!s || s.gamesPlayed === 0 ? (
        <div className="ss-empty">No Cricket games recorded for this period</div>
      ) : (
        <div className="ss-body">

          <div className="ss-hero ss-hero--crk">
            <span className="ss-hero-label">Marks Per Visit</span>
            <span className="ss-hero-value">{f2(s.mpv)}</span>
          </div>

          <div className="ss-section-title">Marks per Visit by Dart Position</div>
          <div className="ss-3cards">
            <div className="ss-card">
              <span className="ss-card-label">1st Dart</span>
              <span className="ss-card-value ss-val--crk">{f2(s.d1Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">2nd Dart</span>
              <span className="ss-card-value ss-val--crk">{f2(s.d2Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">3rd Dart</span>
              <span className="ss-card-value ss-val--crk">{f2(s.d3Mpv)}</span>
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
              <span className="ss-card-value ss-val--crk">{fPct(s.hitPct)}</span>
              <span className="ss-card-sub">darts landing on cricket numbers</span>
            </div>
          </div>

          <div className="ss-section-title">Number Breakdown</div>
          <div className="ss-crk-table">
            <div className="ss-crk-head5">
              <span>#</span>
              <span>MPV</span>
              <span>M1</span>
              <span>M2</span>
              <span>M3</span>
            </div>
            {s.numStats
              .filter(ns => includeBull || ns.number !== 25)
              .map(({ number, marks, m1, m2, m3 }) => {
                const mpv = s.totalVisits > 0 ? marks / s.totalVisits : 0;
                const m1v = s.totalVisits > 0 ? m1 / s.totalVisits : 0;
                const m2v = s.totalVisits > 0 ? m2 / s.totalVisits : 0;
                const m3v = s.totalVisits > 0 ? m3 / s.totalVisits : 0;
                return (
                  <div key={number} className="ss-crk-row5">
                    <span className="ss-crk-num">{number === 25 ? 'Bull' : number}</span>
                    <span>{marks > 0 ? mpv.toFixed(2) : '—'}</span>
                    <span>{marks > 0 ? m1v.toFixed(2) : '—'}</span>
                    <span>{marks > 0 ? m2v.toFixed(2) : '—'}</span>
                    <span>{marks > 0 ? m3v.toFixed(2) : '—'}</span>
                  </div>
                );
              })}
          </div>

          <div className="ss-elo-card ss-elo-card--crk">
            <div className="ss-elo-left">
              <span className="ss-elo-eyebrow">ELO Rating</span>
              <span className="ss-elo-val">N/A</span>
              <span className="ss-elo-sub">tracking coming soon</span>
            </div>
            <div className="ss-elo-chart">
              <svg viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="eloGradCrk" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.18" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="164" height="40" rx="4" fill="url(#eloGradCrk)" />
                <line x1="8" y1="36" x2="172" y2="36" stroke="#1c2a1e" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="44" cy="36" r="2.5" fill="#1a2e1c" />
                <circle cx="78" cy="36" r="2.5" fill="#1a2e1c" />
                <circle cx="112" cy="36" r="2.5" fill="#1a2e1c" />
                <circle cx="146" cy="36" r="2.5" fill="#1a2e1c" />
                <text x="90" y="23" textAnchor="middle" fill="#253028" fontSize="8.5" fontFamily="inherit" letterSpacing="0.04em">ELO HISTORY</text>
              </svg>
            </div>
          </div>

        </div>
      )}
        </>{/* ── Leaderboard page (coming soon) ── */}
        <MiniModeLeaderboard mode="cricket" />
      </SlidingPages>
    </div>
  );
}
