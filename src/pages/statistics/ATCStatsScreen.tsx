import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import SlidingPages from '../../components/shared/SlidingPages';
import MiniModeLeaderboard from '../../components/shared/MiniModeLeaderboard';
import type { GameStats, PlayerDartStats, GameResult } from '../../types';

type FilterKey = '5' | 'week' | 'month' | 'custom';

const ATC_SEQ_FULL = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25];

interface NumDartStat { n: number; avgDarts: number | null; }

interface ATCStats {
  visitAvg: number | null;
  d1Mpv: number | null;
  d2Mpv: number | null;
  d3Mpv: number | null;
  treblePct: number | null;
  doublePct: number | null;
  hitPct: number | null;
  gamesPlayed: number;
  totalDarts: number;
  totalVisits: number;
  numDarts: NumDartStat[];
  lowestVisits: { visits: number; date: number }[];
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
): ATCStats {
  const seq = includeBull ? ATC_SEQ_FULL : ATC_SEQ_FULL.filter(n => n !== 25);
  const emptyNumDarts: NumDartStat[] = seq.map(n => ({ n, avgDarts: null }));
  const empty: ATCStats = {
    visitAvg: null, d1Mpv: null, d2Mpv: null, d3Mpv: null,
    treblePct: null, doublePct: null, hitPct: null,
    gamesPlayed: 0, totalDarts: 0, totalVisits: 0,
    numDarts: emptyNumDarts, lowestVisits: [],
  };

  let games = history.filter(g => g.gameMode === 'aroundTheClock');
  games = applyFilter(games, filter, customFrom, customTo);

  type Entry = { game: GameResult; rec: PlayerDartStats };
  const entries: Entry[] = games
    .map(g => {
      const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
      return rec ? { game: g, rec } : null;
    })
    .filter((x): x is Entry => x !== null);

  if (!entries.length) return empty;

  const numAcc = new Map<number, { totalDarts: number; count: number }>(
    seq.map(n => [n, { totalDarts: 0, count: 0 }]),
  );

  let totalVisits = 0, totalDarts = 0;
  let totalTrebles = 0, totalDoubles = 0, totalHits = 0;
  let d1Advances = 0, d2Advances = 0, d3Advances = 0;
  const lowestVisits: { visits: number; date: number }[] = [];

  for (const { game, rec } of entries) {
    const visits = rec.d1.length;
    totalVisits += visits;
    lowestVisits.push({ visits, date: game.date });

    let pos = 0;
    let dartsOnCurrent = 0;

    for (let t = 0; t < rec.d1.length; t++) {
      const dartTriple: [number, number, number][] = [
        [rec.d1[t] ?? 0, (rec.d1m ?? [])[t] ?? 0, 0],
        [rec.d2[t] ?? 0, (rec.d2m ?? [])[t] ?? 0, 1],
        [rec.d3[t] ?? 0, (rec.d3m ?? [])[t] ?? 0, 2],
      ];
      for (const [score, mult, dartPos] of dartTriple) {
        if (pos >= seq.length) break;
        totalDarts++;
        dartsOnCurrent++;
        if (mult === 3) totalTrebles++;
        if (mult === 2) totalDoubles++;

        if (mult > 0) {
          const base = Math.round(score / mult);
          if (base === seq[pos]) {
            totalHits++;
            const acc = numAcc.get(seq[pos])!;
            acc.totalDarts += dartsOnCurrent;
            acc.count++;
            const advance = Math.min(mult, seq.length - pos);
            if (dartPos === 0) d1Advances += advance;
            else if (dartPos === 1) d2Advances += advance;
            else d3Advances += advance;
            dartsOnCurrent = 0;
            pos++;
            for (let skip = 1; skip < mult && pos < seq.length; skip++) {
              const skipAcc = numAcc.get(seq[pos]);
              if (skipAcc) { skipAcc.totalDarts += 0; skipAcc.count++; }
              pos++;
            }
          }
        }
      }
    }
  }

  lowestVisits.sort((a, b) => a.visits - b.visits);

  return {
    visitAvg: entries.length > 0 ? totalVisits / entries.length : null,
    d1Mpv: totalVisits > 0 ? d1Advances / totalVisits : null,
    d2Mpv: totalVisits > 0 ? d2Advances / totalVisits : null,
    d3Mpv: totalVisits > 0 ? d3Advances / totalVisits : null,
    treblePct: totalDarts > 0 ? (totalTrebles / totalDarts) * 100 : null,
    doublePct: totalDarts > 0 ? (totalDoubles / totalDarts) * 100 : null,
    hitPct: totalDarts > 0 ? (totalHits / totalDarts) * 100 : null,
    gamesPlayed: entries.length,
    totalDarts,
    totalVisits,
    numDarts: seq.map(n => {
      const acc = numAcc.get(n)!;
      return { n, avgDarts: acc.count > 0 ? acc.totalDarts / acc.count : null };
    }),
    lowestVisits: lowestVisits.slice(0, 10),
  };
}

/* ── Bar Chart ─────────────────────────────────────────── */

function ATCBarChart({ data }: { data: NumDartStat[] }) {
  const GW = 320, GH = 160;
  const ML = 28, MR = 8, MT = 12, MB = 24;
  const PW = GW - ML - MR, PH = GH - MT - MB;
  const n = data.length;
  const barW = Math.max(2, (PW / n) - 2);
  const valid = data.filter(d => d.avgDarts !== null);

  if (!valid.length) {
    return (
      <svg viewBox={`0 0 ${GW} ${GH}`} className="ss-atc-chart" preserveAspectRatio="xMidYMid meet">
        <text x={GW / 2} y={GH / 2} className="ss-chart-empty" textAnchor="middle" dominantBaseline="middle">
          Not enough data yet
        </text>
      </svg>
    );
  }

  const maxVal = Math.max(...valid.map(d => d.avgDarts!), 1);
  const step = Math.max(1, Math.ceil(maxVal / 4));
  const yMax = Math.ceil(maxVal / step) * step;
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += step) yTicks.push(v);
  const minVal = Math.min(...valid.map(d => d.avgDarts!));
  const bestIdx = data.findIndex(d => d.avgDarts === minVal);
  const LABELS = new Set([1, 5, 10, 15, 20, 25]);

  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} className="ss-atc-chart" preserveAspectRatio="xMidYMid meet">
      {yTicks.map(v => {
        const y = MT + PH - (v / yMax) * PH;
        return (
          <g key={v}>
            <line x1={ML} y1={y} x2={ML + PW} y2={y} className="ss-chart-grid" />
            <text x={ML - 3} y={y + 3} className="ss-chart-tick" textAnchor="end">{v}</text>
          </g>
        );
      })}
      <line x1={ML} y1={MT} x2={ML} y2={MT + PH} className="ss-chart-axis" />
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} className="ss-chart-axis" />
      {data.map(({ n: num, avgDarts }, i) => {
        if (avgDarts === null) return null;
        const x = ML + (i / n) * PW + 1;
        const h = Math.max(1, (avgDarts / yMax) * PH);
        return (
          <rect key={num} x={x} y={MT + PH - h} width={barW} height={h}
            fill={i === bestIdx ? '#f59e0b' : '#3b82f6'} rx={1.5} />
        );
      })}
      {data.map(({ n: num }, i) => {
        if (!LABELS.has(num)) return null;
        return (
          <text key={num} x={ML + (i / n) * PW + barW / 2 + 1} y={GH - 6}
            className="ss-chart-tick" textAnchor="middle">
            {num === 25 ? 'B' : num}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Screen ────────────────────────────────────────────── */

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

const FILTERS: [FilterKey, string][] = [
  ['5', 'Last 5'], ['week', 'Last Week'], ['month', 'Last Month'], ['custom', 'Custom'],
];

export default function ATCStatsScreen() {
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

  const f1 = (v: number | null) => v !== null ? v.toFixed(1) : '—';
  const f2 = (v: number | null) => v !== null ? v.toFixed(2) : '—';
  const fPct = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="ss-page">

      <div className="ss-screen-header ss-screen-header--atc">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">{page === 0 ? 'Around the Clock Stats' : 'ATC Leaderboard'}</span>
      </div>

      <SlidingPages accentClass="sliding-dot--atc" onPageChange={setPage} initialPage={page}>
        <>{/* ── Stats page ── */}

      <div className="ss-filters-grid">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`ss-pill${filter === k ? ' ss-pill--active ss-pill--atc' : ''}`}
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
        <div className="ss-empty">No Around the Clock games recorded for this period</div>
      ) : (
        <div className="ss-body">

          <div className="ss-hero ss-hero--atc">
            <span className="ss-hero-label">Visit Average</span>
            <span className="ss-hero-value">{f1(s.visitAvg)}</span>
            <span className="ss-hero-hint">avg visits to finish · lower is better</span>
          </div>

          <div className="ss-section-title">Marks per Visit by Dart Position</div>
          <div className="ss-3cards">
            <div className="ss-card">
              <span className="ss-card-label">1st Dart</span>
              <span className="ss-card-value ss-val--atc">{f2(s.d1Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">2nd Dart</span>
              <span className="ss-card-value ss-val--atc">{f2(s.d2Mpv)}</span>
              <span className="ss-card-sub">MPV</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-label">3rd Dart</span>
              <span className="ss-card-value ss-val--atc">{f2(s.d3Mpv)}</span>
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
              <span className="ss-card-value ss-val--atc">{fPct(s.hitPct)}</span>
              <span className="ss-card-sub">darts hitting current target</span>
            </div>
          </div>

          <div className="ss-section-title">Avg Darts to Hit Each Number</div>
          <div className="ss-chart-card">
            <div className="ss-chart-hint">
              <span className="ss-dot-gold" /> best number · bars = avg darts needed
            </div>
            <ATCBarChart data={s.numDarts} />
          </div>

          {s.lowestVisits.length > 0 && (
            <div className="ss-table-card">
              <div className="ss-table-title">Lowest Visits Records</div>
              <div className="ss-lv-grid ss-lv-grid--head">
                <span>Visits</span><span>Date</span>
              </div>
              {s.lowestVisits.map((lv, i) => (
                <div key={i} className="ss-lv-grid">
                  <span className="ss-lv-visits ss-val--atc">{lv.visits}</span>
                  <span className="ss-lv-date">{fmtDate(lv.date)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ss-elo-card ss-elo-card--atc">
            <div className="ss-elo-left">
              <span className="ss-elo-eyebrow">ELO Rating</span>
              <span className="ss-elo-val">N/A</span>
              <span className="ss-elo-sub">tracking coming soon</span>
            </div>
            <div className="ss-elo-chart">
              <svg viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="eloGradAtc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.18" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="164" height="40" rx="4" fill="url(#eloGradAtc)" />
                <line x1="8" y1="36" x2="172" y2="36" stroke="#1a1e2a" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="44" cy="36" r="2.5" fill="#1a1e2e" />
                <circle cx="78" cy="36" r="2.5" fill="#1a1e2e" />
                <circle cx="112" cy="36" r="2.5" fill="#1a1e2e" />
                <circle cx="146" cy="36" r="2.5" fill="#1a1e2e" />
                <text x="90" y="23" textAnchor="middle" fill="#252830" fontSize="8.5" fontFamily="inherit" letterSpacing="0.04em">ELO HISTORY</text>
              </svg>
            </div>
          </div>

        </div>
      )}
        </>{/* ── Leaderboard page (coming soon) ── */}
        <MiniModeLeaderboard mode="aroundTheClock" />
      </SlidingPages>
    </div>
  );
}
