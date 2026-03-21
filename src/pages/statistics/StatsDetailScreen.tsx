import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import SlidingPages from '../../components/shared/SlidingPages';
import OverallLeaderboard from '../../components/shared/OverallLeaderboard';
import type { GameStats, GameResult } from '../../types';

/* ── Types ───────────────────────────────────────────────── */

const MODES = [
  { key: 'x01',            label: 'X01' },
  { key: 'cricket',        label: 'Cricket' },
  { key: 'aroundTheClock', label: 'ATC' },
  { key: 'firstTo',        label: 'First To' },
] as const;

interface OverallStats {
  maxes: number;
  bigTons: number;
  tons: number;
  mpv: number | null;
  legs: Record<string, number>;
  darts: Record<string, number>;
  totalLegs: number;
  totalDarts: number;
}

/* ── Compute ─────────────────────────────────────────────── */

function computeStats(history: GameResult[], profileId: string): OverallStats {
  let maxes = 0, bigTons = 0, tons = 0;
  let totalMarks = 0, totalMarkVisits = 0;
  const legs: Record<string, number> = {};
  const darts: Record<string, number> = {};

  for (const g of history) {
    if (!g.players.includes(profileId)) continue;
    const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;

    const mode = g.gameMode;
    legs[mode] = (legs[mode] ?? 0) + 1;
    const d = (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;
    darts[mode] = (darts[mode] ?? 0) + d;

    const visits = rec.d1.length;

    if (mode === 'x01') {
      for (let i = 0; i < visits; i++) {
        const score = (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
        if (score === 180) maxes++;
        else if (score >= 140) bigTons++;
        else if (score >= 100) tons++;
      }
    } else {
      totalMarkVisits += visits;
      for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
        for (const v of arr) totalMarks += v;
    }
  }

  const totalLegs = Object.values(legs).reduce((a, b) => a + b, 0);
  const totalDarts = Object.values(darts).reduce((a, b) => a + b, 0);

  return {
    maxes, bigTons, tons,
    mpv: totalMarkVisits > 0 ? totalMarks / totalMarkVisits : null,
    legs, darts, totalLegs, totalDarts,
  };
}

/* ── Screen ──────────────────────────────────────────────── */

export default function StatsDetailScreen() {
  const goto = useGoto();
  const history = useStatisticsStore(s => s.history);
  const { activeProfileId } = useProfilesStore();
  const loc = useLocation();
  const [page, setPage] = useState((loc.state as { leaderboard?: boolean } | null)?.leaderboard ? 1 : 0);

  const s = activeProfileId ? computeStats(history, activeProfileId) : null;
  const f2 = (v: number | null) => v !== null ? v.toFixed(2) : '—';
  const num = (v: number) => v > 0 ? v.toLocaleString() : '—';

  return (
    <div className="ss-page">

      <div className="ss-screen-header ss-screen-header--overall">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">{page === 0 ? 'Overall Stats' : 'Overall Leaderboard'}</span>
      </div>

      <SlidingPages onPageChange={setPage} initialPage={page}>
        <>
          {!s || s.totalLegs === 0 ? (
            <div className="ss-empty">No games recorded yet</div>
          ) : (
            <div className="ss-body">

              {/* X01 Scoring */}
              <div className="ss-section-title">X01 Scoring</div>
              <div className="ss-3cards">
                <div className="ss-card ss-card--pop">
                  <span className="ss-card-label ss-card-label--bright">180s</span>
                  <span className="ss-card-value ss-val--x01 ss-card-value--xl">{s.maxes || '—'}</span>
                  <span className="ss-card-sub">maximums</span>
                </div>
                <div className="ss-card ss-card--pop">
                  <span className="ss-card-label ss-card-label--bright">140+</span>
                  <span className="ss-card-value ss-card-value--xl">{s.bigTons || '—'}</span>
                  <span className="ss-card-sub">big tons</span>
                </div>
                <div className="ss-card ss-card--pop">
                  <span className="ss-card-label ss-card-label--bright">100+</span>
                  <span className="ss-card-value ss-card-value--xl">{s.tons || '—'}</span>
                  <span className="ss-card-sub">tons</span>
                </div>
              </div>

              {/* MPV */}
              <div className="ss-cards">
                <div className="ss-card ss-card--wide ss-card--pop">
                  <span className="ss-card-label ss-card-label--bright">Marks Per Visit</span>
                  <span className="ss-card-value ss-card-value--xl">{f2(s.mpv)}</span>
                  <span className="ss-card-sub">Cricket · ATC · First To (combined)</span>
                </div>
              </div>

              {/* Legs breakdown */}
              <div className="ss-section-title">Legs Played</div>
              <div className="ss-overall-table">
                <div className="ss-overall-head">
                  <span>Mode</span>
                  <span>Legs</span>
                  <span>Darts</span>
                </div>
                {MODES.map(({ key, label }) => (
                  (s.legs[key] ?? 0) > 0 && (
                    <div key={key} className="ss-overall-row">
                      <span className={`ss-overall-mode ss-overall-mode--${key === 'x01' ? 'x01' : key === 'cricket' ? 'crk' : key === 'aroundTheClock' ? 'atc' : 'ft'}`}>
                        {label}
                      </span>
                      <span>{num(s.legs[key] ?? 0)}</span>
                      <span>{num(s.darts[key] ?? 0)}</span>
                    </div>
                  )
                ))}
                <div className="ss-overall-row ss-overall-row--total">
                  <span>Total</span>
                  <span>{num(s.totalLegs)}</span>
                  <span>{num(s.totalDarts)}</span>
                </div>
              </div>

              <div className="ss-elo-card ss-elo-card--overall">
                <div className="ss-elo-left">
                  <span className="ss-elo-eyebrow">Overall ELO</span>
                  <span className="ss-elo-val">N/A</span>
                  <span className="ss-elo-sub">tracking coming soon</span>
                </div>
                <div className="ss-elo-chart">
                  <svg viewBox="0 0 180 56" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                      <linearGradient id="eloGradOverall" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#888" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#888" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                    <rect x="8" y="8" width="164" height="40" rx="4" fill="url(#eloGradOverall)" />
                    <line x1="8" y1="36" x2="172" y2="36" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
                    <circle cx="44" cy="36" r="2.5" fill="#222" />
                    <circle cx="78" cy="36" r="2.5" fill="#222" />
                    <circle cx="112" cy="36" r="2.5" fill="#222" />
                    <circle cx="146" cy="36" r="2.5" fill="#222" />
                    <text x="90" y="23" textAnchor="middle" fill="#282828" fontSize="8.5" fontFamily="inherit" letterSpacing="0.04em">ELO HISTORY</text>
                  </svg>
                </div>
              </div>

            </div>
          )}
        </>
        <OverallLeaderboard />
      </SlidingPages>
    </div>
  );
}
