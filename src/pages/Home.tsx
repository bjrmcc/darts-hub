import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useProfilesStore } from '../store/profilesStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { useGoto } from '../hooks/useGoto';
import DataLoading from '../components/shared/DataLoading';
import { DartIcon, CricketIcon, ClockIcon, FlagIcon, BullseyeIcon } from '../components/shared/GameIcons';
import type { GameStats } from '../types';

/* ── Stat helpers ───────────────────────────────────────── */

type LeaderEntry = { name: string; avg: string };

function multAvg(mults: number[]) {
  if (!mults.length) return '—';
  return (mults.reduce((s, m) => s + m, 0) / mults.length).toFixed(2);
}


function computeLeaderboard(
  history: ReturnType<typeof useStatisticsStore.getState>['history'],
): LeaderEntry[] {
  const map = new Map<string, { name: string; mults: number[] }>();
  for (const game of history) {
    for (const p of (game.stats as GameStats).players) {
      if (!map.has(p.playerId)) map.set(p.playerId, { name: p.playerName, mults: [] });
      map.get(p.playerId)!.mults.push(...(p.d1m ?? []), ...(p.d2m ?? []), ...(p.d3m ?? []));
    }
  }
  return Array.from(map.values())
    .map(p => ({ name: p.name, avg: multAvg(p.mults) }))
    .filter(p => p.avg !== '—')
    .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))
    .slice(0, 3);
}

function computeModeMpv(
  history: ReturnType<typeof useStatisticsStore.getState>['history'],
  profileId: string | undefined,
  gameMode: string,
): string {
  if (!profileId) return '—';
  let totalMarks = 0, totalVisits = 0;
  for (const game of history) {
    if (game.gameMode !== gameMode) continue;
    const rec = (game.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;
    totalVisits += rec.d1.length;
    for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][]) {
      for (const v of arr) totalMarks += v;
    }
  }
  return totalVisits > 0 ? (totalMarks / totalVisits).toFixed(2) : '—';
}

function computeOverallPreview(
  history: ReturnType<typeof useStatisticsStore.getState>['history'],
  profileId: string | undefined,
) {
  let legs = 0, darts = 0, maxes = 0, totalMarks = 0, totalVisits = 0;
  if (!profileId) return { legs, darts, maxes, mpv: '—' };

  for (const game of history) {
    const rec = (game.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;
    legs++;
    darts += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;
    const visits = rec.d1.length;
    totalVisits += visits;
    for (let i = 0; i < visits; i++) {
      const d1m = (rec.d1m ?? [])[i] ?? 0;
      const d2m = (rec.d2m ?? [])[i] ?? 0;
      const d3m = (rec.d3m ?? [])[i] ?? 0;
      if (game.gameMode === 'x01') {
        if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180) maxes++;
      } else {
        totalMarks += d1m + d2m + d3m;
      }
    }
  }

  const mpv = totalVisits > 0 ? (totalMarks / totalVisits).toFixed(2) : '—';
  return { legs, darts, maxes, mpv };
}

function computeX01Preview(
  history: ReturnType<typeof useStatisticsStore.getState>['history'],
  profileId: string | undefined,
) {
  let totalScore = 0, totalVisits = 0, coDarts = 0, coDoubles = 0;
  if (!profileId) return { avg: '—', coPct: '—' };

  for (const game of history) {
    if (game.gameMode !== 'x01') continue;
    const rec = (game.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;
    for (let i = 0; i < rec.d1.length; i++) {
      totalScore += (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
      totalVisits++;
    }
    if (rec.won && rec.checkout) {
      for (const dart of rec.checkout.darts) {
        coDarts++;
        if (dart.startsWith('D')) coDoubles++;
      }
    }
  }

  return {
    avg: totalVisits > 0 ? (totalScore / totalVisits).toFixed(2) : '—',
    coPct: coDarts > 0 ? `${((coDoubles / coDarts) * 100).toFixed(1)}%` : '—',
  };
}

/* ── Preview components ─────────────────────────────────── */

function X01Preview({ avg, coPct }: ReturnType<typeof computeX01Preview>) {
  return (
    <div className="home-tile-preview">
      <div className="htp-cols htp-cols--2">
        <div className="htp-col htp-col--all">
          <span className="htp-col-label">3DA</span>
          <span className="htp-col-val">{avg}</span>
        </div>
        <div className="htp-col htp-col--all">
          <span className="htp-col-label">Checkout %</span>
          <span className="htp-col-val">{coPct}</span>
        </div>
      </div>
    </div>
  );
}

function OverallPreview({ legs, darts, maxes, mpv }: ReturnType<typeof computeOverallPreview>) {
  return (
    <div className="home-tile-preview">
      <div className="htp-cols">
        {([['180s', String(maxes)], ['MPV', mpv], ['Legs', legs.toLocaleString()], ['Darts', darts.toLocaleString()]] as [string, string][]).map(([lbl, val]) => (
          <div key={lbl} className="htp-col htp-col--all">
            <span className="htp-col-label">{lbl}</span>
            <span className="htp-col-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeMpvPreview({ mpv }: { mpv: string }) {
  return (
    <div className="home-tile-preview">
      <div className="htp-cols htp-cols--2">
        <div className="htp-col htp-col--all">
          <span className="htp-col-label">MPV</span>
          <span className="htp-col-val">{mpv}</span>
        </div>
        <div className="htp-col">
          <span className="htp-col-label">ELO</span>
          <span className="htp-col-val">N/A</span>
        </div>
      </div>
    </div>
  );
}


function LeaderPreview({ entries }: { entries: LeaderEntry[] }) {
  if (!entries.length) {
    return <div className="home-tile-preview htp-empty">No data yet</div>;
  }
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="home-tile-preview">
      {entries.map((e, i) => (
        <div key={e.name} className="htp-leader-row">
          <span className="htp-medal">{medals[i]}</span>
          <span className="htp-leader-name">{e.name}</span>
          <span className="htp-leader-avg">{e.avg}</span>
        </div>
      ))}
    </div>
  );
}


function BarChartIcon() {
  return (
    <svg viewBox="0 0 60 60" className="home-tile-icon" aria-hidden>
      <rect x="8"  y="30" width="10" height="20" rx="2" fill="#7a9be0" />
      <rect x="22" y="18" width="10" height="32" rx="2" fill="#7a9be0" />
      <rect x="36" y="10" width="10" height="40" rx="2" fill="#c0392b" />
      <rect x="50" y="22" width="10" height="28" rx="2" fill="#7a9be0" />
      <line x1="5" y1="50" x2="63" y2="50" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="13,30 27,18 41,10 55,22" fill="none" stroke="#ffffff33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 60 60" className="home-tile-icon" aria-hidden>
      <path d="M18,10 L18,28 Q18,42 30,42 Q42,42 42,28 L42,10 Z" fill="none" stroke="#c8a951" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18,14 Q8,14 8,22 Q8,30 18,30" fill="none" stroke="#c8a951" strokeWidth="2" strokeLinecap="round" />
      <path d="M42,14 Q52,14 52,22 Q52,30 42,30" fill="none" stroke="#c8a951" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="42" x2="30" y2="50" stroke="#c8a951" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="21" y1="50" x2="39" y2="50" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="24" r="3.5" fill="none" stroke="#c8a95166" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Tile data ──────────────────────────────────────────── */

const PLAY_TILES = [
  { label: 'X01',              sub: 'Count down from 501 or 301 to exactly zero. Your final dart must land on a double.',                                                      route: ROUTES.X01_SETUP,      Icon: DartIcon,     hero: true,  accent: 'red'    },
  { label: 'Cricket',          sub: 'Open 15–20 and Bull by hitting each three times, then score on numbers your opponent hasn\'t opened yet.',                                route: ROUTES.CRICKET_SETUP,  Icon: CricketIcon,              accent: 'green'  },
  { label: 'Around the Clock', sub: 'Hit 1 through 20 in order then finish on Bull. Doubles and trebles jump you ahead.',                                                      route: ROUTES.ATC_SETUP,      Icon: ClockIcon,                accent: 'blue'   },
  { label: 'First To',         sub: 'Pick any number on the board and race to hit it the required times. Doubles and trebles count as 2 and 3.',                               route: ROUTES.FIRST_TO_SETUP, Icon: FlagIcon,                 accent: 'amber'  },
  { label: 'Free Throw',       sub: 'No win condition — just throw and track your accuracy on any number.',                                                                    route: ROUTES.PRACTICE,       Icon: BullseyeIcon,             accent: 'purple' },
];

type StatsTile = {
  label: string; sub: string; route: string; Icon: React.ComponentType<{ className?: string }>;
  modes?: string[] | null; leaderboard?: boolean; accent: string;
};

const STATS_OVERALL: StatsTile = { label: 'Overall', sub: 'All game modes', route: ROUTES.STATS_DETAIL, Icon: BarChartIcon, modes: null, accent: 'dim' };

const STATS_MID_TILES: StatsTile[] = [
  { label: 'X01',          sub: 'Personal stats', route: ROUTES.STATS_X01,          Icon: DartIcon,    modes: ['x01'],    accent: 'red'  },
  { label: 'Leaderboards', sub: 'All players',    route: ROUTES.STATISTICS_GENERAL, Icon: TrophyIcon,  leaderboard: true, accent: 'gold' },
];

const STATS_MODE_TILES: StatsTile[] = [
  { label: 'Cricket',  sub: 'Personal stats', route: ROUTES.STATS_CRICKET,    Icon: CricketIcon, modes: ['cricket'],        accent: 'green' },
  { label: 'ATC',      sub: 'Personal stats', route: ROUTES.STATS_ATC,        Icon: ClockIcon,   modes: ['aroundTheClock'], accent: 'blue'  },
  { label: 'First To', sub: 'Personal stats', route: ROUTES.STATS_FIRST_TO,   Icon: FlagIcon,    modes: ['firstTo'],        accent: 'amber' },
];

/* ── Screen ─────────────────────────────────────────────── */

export default function Home() {
  const goto = useGoto();
  const { pathname } = useLocation();
  const { activeProfileId } = useProfilesStore();
  const history = useStatisticsStore(s => s.history);

  const statsLoaded = useStatisticsStore(s => s.loaded);
  const isStats = pathname === ROUTES.STATS_HOME;
  const leaderEntries = isStats ? computeLeaderboard(history) : [];

  return (
    <div className="home-page">
      <div className="home-panel">

        {!isStats && (
          <div className="home-grid">
            {PLAY_TILES.map(({ label, sub, route, Icon, hero, accent }) => (
              <div key={label} className={`home-tile home-tile--${accent}${hero ? ' home-tile--hero' : ''}`} onClick={() => goto(route)}>
                <div className="home-tile-icon-wrap"><Icon /></div>
                <div className="home-tile-text">
                  <span className="home-tile-name">{label}</span>
                  <span className="home-tile-sub">{sub}</span>
                </div>
                <span className="home-tile-arrow">›</span>
              </div>
            ))}
          </div>
        )}

        {isStats && !statsLoaded && <DataLoading />}

        {isStats && statsLoaded && (
          <div className="home-stats-layout">

            {/* Overall — full width */}
            {(() => {
              const { label, sub, route, Icon, accent } = STATS_OVERALL;
              const prev = computeOverallPreview(history, activeProfileId ?? undefined);
              return (
                <div className={`home-tile home-tile--stat home-tile--${accent} home-tile--hero`} onClick={() => goto(route)}>
                  <div className="home-tile-stat-top">
                    <div className="home-tile-icon-wrap-sm"><Icon /></div>
                    <div className="home-tile-title-col">
                      <span className="home-tile-name">{label}</span>
                      <span className="home-tile-sub">{sub}</span>
                    </div>
                  </div>
                  <OverallPreview {...prev} />
                </div>
              );
            })()}

            {/* X01 + Leaderboards */}
            <div className="home-grid">
              {STATS_MID_TILES.map(({ label, sub, route, Icon, leaderboard, accent }) => {
                const x01prev = label === 'X01' ? computeX01Preview(history, activeProfileId ?? undefined) : null;
                return (
                  <div key={label} className={`home-tile home-tile--stat home-tile--${accent} home-tile--prominent`} onClick={() => goto(route)}>
                    <div className="home-tile-stat-top">
                      <div className="home-tile-icon-wrap-sm"><Icon /></div>
                      <div className="home-tile-title-col">
                        <span className="home-tile-name">{label}</span>
                        <span className="home-tile-sub">{sub}</span>
                      </div>
                    </div>
                    {x01prev && <X01Preview {...x01prev} />}
                    {leaderboard && <LeaderPreview entries={leaderEntries} />}
                  </div>
                );
              })}
            </div>

            {/* Cricket · ATC · First To */}
            <div className="home-grid home-grid--3col">
              {STATS_MODE_TILES.map(({ label, route, Icon, accent, modes }) => {
                const mpv = computeModeMpv(history, activeProfileId ?? undefined, modes![0]);
                return (
                  <div key={label} className={`home-tile home-tile--stat home-tile--${accent}`} onClick={() => goto(route)}>
                    <div className="home-tile-stat-top">
                      <div className="home-tile-icon-wrap-sm"><Icon /></div>
                      <div className="home-tile-title-col">
                        <span className="home-tile-name">{label}</span>
                      </div>
                    </div>
                    <ModeMpvPreview mpv={mpv} />
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
