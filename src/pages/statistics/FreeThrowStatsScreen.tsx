import { useState } from 'react';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import DataLoading from '../../components/shared/DataLoading';
import type { GameStats } from '../../types';

type Filter = '5' | 'month' | 'all';

const FILTERS: [Filter, string][] = [
  ['5',     'Last 5'],
  ['month', 'Last Month'],
  ['all',   'All Time'],
];

const ALL_NUMBERS = [25, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;


export default function FreeThrowStatsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore((s) => s.history);
  const statsLoaded = useStatisticsStore((s) => s.loaded);
  const { activeProfileId } = useProfilesStore();
  const [filter, setFilter] = useState<Filter>('all');

  const now = Date.now();
  let sessions = history.filter(g => g.gameMode === 'practice');
  if (filter === '5')     sessions = sessions.slice(0, 5);
  if (filter === 'month') sessions = sessions.filter(g => g.date >= now - 30 * 86400000);

  const records = sessions
    .flatMap(g => (g.stats as GameStats).players)
    .filter(p => p.playerId === activeProfileId);

  const d1  = records.flatMap(r => r.d1);
  const d2  = records.flatMap(r => r.d2);
  const d3  = records.flatMap(r => r.d3);
  const d1m = records.flatMap(r => r.d1m ?? []);
  const d2m = records.flatMap(r => r.d2m ?? []);
  const d3m = records.flatMap(r => r.d3m ?? []);

  const totalDarts   = d1m.length + d2m.length + d3m.length;
  const allMults     = [...d1m, ...d2m, ...d3m];
  const trebleRate   = totalDarts > 0 ? (allMults.filter(m => m === 3).length / totalDarts * 100) : null;
  const doubleRate   = totalDarts > 0 ? (allMults.filter(m => m === 2).length / totalDarts * 100) : null;

  // Per-position treble rates
  const d1TreblePct = d1m.length > 0 ? d1m.filter(m => m === 3).length / d1m.length * 100 : null;
  const d2TreblePct = d2m.length > 0 ? d2m.filter(m => m === 3).length / d2m.length * 100 : null;
  const d3TreblePct = d3m.length > 0 ? d3m.filter(m => m === 3).length / d3m.length * 100 : null;

  // Per-number hit rates (overall, across all dart positions)
  function hitsOnNumber(scores: number[], mults: number[], n: number): number {
    let count = 0;
    for (let i = 0; i < scores.length; i++) {
      if (mults[i] > 0 && Math.round(scores[i] / mults[i]) === n) count++;
    }
    return count;
  }

  const allScores = [...d1, ...d2, ...d3];
  const numberData = ALL_NUMBERS.map(n => {
    const hits = hitsOnNumber(allScores, allMults, n);
    return { n, hits, hitPct: totalDarts > 0 ? hits / totalDarts * 100 : 0 };
  });

  const maxHitPct = Math.max(...numberData.map(d => d.hitPct), 1);
  const hasData   = totalDarts > 0;

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
        <div className="prac-empty">No Free Throw sessions recorded yet</div>
      ) : (
        <div className="prac-body">

          {/* ── hero: total activity ── */}
          <div className="prac-hero">
            <div className="prac-hero-inner">
              <span className="prac-hero-label">Total Darts Thrown</span>
              <span className="prac-hero-value">{totalDarts.toLocaleString()}</span>
              <span className="prac-hero-sub">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* ── overall precision ── */}
          <div className="prac-row">
            <div className="prac-card">
              <span className="prac-card-label">Treble Rate</span>
              <span className="prac-card-value prac-card-value--red">{fmtPct(trebleRate)}</span>
              <span className="prac-card-sub">of all darts</span>
            </div>
            <div className="prac-card">
              <span className="prac-card-label">Double Rate</span>
              <span className="prac-card-value prac-card-value--blue">{fmtPct(doubleRate)}</span>
              <span className="prac-card-sub">of all darts</span>
            </div>
          </div>

          {/* ── treble consistency by dart position ── */}
          <div className="prac-section-label">Treble Rate by Dart</div>
          <div className="prac-row">
            {([['1st', d1TreblePct], ['2nd', d2TreblePct], ['3rd', d3TreblePct]] as const).map(([pos, val]) => (
              <div key={pos} className="prac-card">
                <span className="prac-card-label">{pos} dart</span>
                <span className="prac-card-value">{fmtPct(val)}</span>
              </div>
            ))}
          </div>

          {/* ── per-number hit rate ── */}
          <div className="prac-numbers">
            <div className="prac-numbers-header">
              <span className="prac-numbers-title">Hit Rate by Number</span>
              <span className="prac-numbers-hint">% of all darts landing on that number</span>
            </div>

            {numberData.map(({ n, hits, hitPct }) => {
              const barPct = maxHitPct > 0 ? (hitPct / maxHitPct) * 100 : 0;
              return (
                <div key={n} className="prac-num-row">
                  <span className="prac-num-label">{n === 25 ? 'Bull' : n}</span>
                  <div className="prac-num-bar-bg">
                    <div className="prac-num-bar" style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="prac-num-pct">{hits > 0 ? `${hitPct.toFixed(1)}%` : '—'}</span>
                </div>
              );
            })}
          </div>

        </div>
      )}

      <button className="secondary prac-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>Back</button>
    </div>
  );
}
