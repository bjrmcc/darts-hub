import { ROUTES } from '../constants';
import { useProfilesStore } from '../store/profilesStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { useGoto } from '../hooks/useGoto';
import DataLoading from '../components/shared/DataLoading';
import { useLastSetupStore } from '../store/lastSetupStore';
import { DartIcon, CricketIcon, ClockIcon, FlagIcon, BullseyeIcon } from '../components/shared/GameIcons';
import type { GameStats, GameResult } from '../types';
import type { Profile } from '../types';

/* ── Stats helpers ───────────────────────────────────────── */

function compute180sLeaderboard(
  history: GameResult[],
  profiles: Profile[],
): { name: string; maxes: number }[] {
  return profiles
    .map(p => {
      let maxes = 0;
      for (const g of history) {
        const rec = (g.stats as GameStats).players.find(pl => pl.playerId === p.id);
        if (!rec) continue;
        for (let i = 0; i < rec.d1.length; i++)
          if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180) maxes++;
      }
      return { name: p.name, maxes };
    })
    .filter(p => p.maxes > 0)
    .sort((a, b) => b.maxes - a.maxes)
    .slice(0, 3);
}

function count180s(history: GameResult[], profileId: string): number {
  let total = 0;
  for (const g of history) {
    const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;
    for (let i = 0; i < rec.d1.length; i++) {
      if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180) total++;
    }
  }
  return total;
}

function computeMPV(history: GameResult[], profileId: string): string {
  let marks = 0, visits = 0;
  for (const g of history) {
    if (g.gameMode !== 'cricket') continue;
    const rec = (g.stats as GameStats).players.find(p => p.playerId === profileId);
    if (!rec) continue;
    visits += rec.d1.length;
    for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
      for (const v of arr) marks += v;
  }
  if (!visits) return '—';
  return (marks / visits).toFixed(2);
}

/* ── News feed ───────────────────────────────────────────── */

interface FeedItem {
  id: string;
  icon: string;
  text: string;
  date: number;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] ?? s[v] ?? s[0]) as string;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const GAME_MILESTONES = [1, 10, 25, 50, 100, 250, 500];
const MAX_180_MILESTONES = [1, 5, 10, 25, 50, 100];
const DART_COUNT_MILESTONES = [100, 500, 1000, 5000, 10000];

function generateFeedItems(history: GameResult[], profiles: Profile[]): FeedItem[] {
  const items: FeedItem[] = [];

  // ── Profile joined
  for (const p of profiles) {
    items.push({
      id: `joined-${p.id}`,
      icon: '👤',
      text: `${p.name} joined Darts Hub`,
      date: p.createdAt,
    });
  }

  // ── Last login
  for (const p of profiles) {
    if (p.lastActive) {
      items.push({
        id: `login-${p.id}-${p.lastActive}`,
        icon: '🟢',
        text: `${p.name} logged in`,
        date: p.lastActive,
      });
    }
  }

  // ── Per-profile game milestones
  for (const p of profiles) {
    const playerGames = history
      .filter(g => g.players.includes(p.id))
      .slice()
      .sort((a, b) => a.date - b.date);

    // Games played milestones
    for (const milestone of GAME_MILESTONES) {
      if (playerGames.length >= milestone) {
        items.push({
          id: `games-${p.id}-${milestone}`,
          icon: '🎯',
          text: `${p.name} played their ${milestone}${ordinal(milestone)} game!`,
          date: playerGames[milestone - 1].date,
        });
      }
    }

    // 180 milestones (X01 only)
    const maxDates: number[] = [];
    for (const g of playerGames) {
      if (g.gameMode !== 'x01') continue;
      const rec = (g.stats as GameStats).players.find(pl => pl.playerId === p.id);
      if (!rec) continue;
      for (let i = 0; i < rec.d1.length; i++) {
        if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180) {
          maxDates.push(g.date);
        }
      }
    }
    for (const milestone of MAX_180_MILESTONES) {
      if (maxDates.length >= milestone) {
        items.push({
          id: `180s-${p.id}-${milestone}`,
          icon: '💯',
          text: `${p.name} hit their ${milestone}${ordinal(milestone)} maximum 180!`,
          date: maxDates[milestone - 1],
        });
      }
    }

    // Total darts milestones
    let dartCount = 0;
    for (const g of playerGames) {
      const rec = (g.stats as GameStats).players.find(pl => pl.playerId === p.id);
      if (!rec) continue;
      const prev = dartCount;
      dartCount += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;
      for (const milestone of DART_COUNT_MILESTONES) {
        if (prev < milestone && dartCount >= milestone) {
          items.push({
            id: `darts-${p.id}-${milestone}`,
            icon: '🎳',
            text: `${p.name} has thrown ${milestone.toLocaleString()} darts!`,
            date: g.date,
          });
        }
      }
    }

    // Random X01 avg stat
    const x01games = playerGames.filter(g => g.gameMode === 'x01');
    if (x01games.length >= 3) {
      let totalScore = 0, totalVisits = 0;
      for (const g of x01games) {
        const rec = (g.stats as GameStats).players.find(pl => pl.playerId === p.id);
        if (!rec) continue;
        for (let i = 0; i < rec.d1.length; i++) {
          totalScore += (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
          totalVisits++;
        }
      }
      if (totalVisits > 0) {
        items.push({
          id: `stat-avg-${p.id}`,
          icon: '📊',
          text: `${p.name}'s X01 three-dart average is ${(totalScore / totalVisits).toFixed(2)}`,
          date: x01games[x01games.length - 1].date + 1,
        });
      }
    }

    // Cricket MPV stat
    const crkGames = playerGames.filter(g => g.gameMode === 'cricket');
    if (crkGames.length >= 2) {
      let marks = 0, visits = 0;
      for (const g of crkGames) {
        const rec = (g.stats as GameStats).players.find(pl => pl.playerId === p.id);
        if (!rec) continue;
        visits += rec.d1.length;
        for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
          for (const v of arr) marks += v;
      }
      if (visits > 0) {
        items.push({
          id: `stat-crk-${p.id}`,
          icon: '🏏',
          text: `${p.name}'s Cricket marks per visit: ${(marks / visits).toFixed(2)}`,
          date: crkGames[crkGames.length - 1].date + 1,
        });
      }
    }
  }

  // ── Current leaderboard snapshot
  const leaderboard = compute180sLeaderboard(history, profiles);
  if (leaderboard.length >= 2) {
    const top = leaderboard
      .slice(0, 3)
      .map((entry, i) => `${['1st', '2nd', '3rd'][i]} ${entry.name}`)
      .join(' · ');
    items.push({
      id: 'leaderboard-snapshot',
      icon: '🏆',
      text: `Leaderboard: ${top}`,
      date: Date.now(),
    });
  }

  return items.sort((a, b) => b.date - a.date);
}

function NewsFeed({ items }: { items: FeedItem[] }) {
  if (!items.length) {
    return (
      <div className="news-empty">
        Play some games to see activity here
      </div>
    );
  }

  const doubled = [...items, ...items];
  const itemH = 48;
  const totalH = items.length * itemH;
  const duration = Math.max(10, items.length * 3.5);

  return (
    <div className="news-feed-window">
      <div
        className="news-feed-track"
        style={{
          '--news-h': `${totalH}px`,
          '--news-dur': `${duration}s`,
        } as React.CSSProperties}
      >
        {doubled.map((item, i) => (
          <div key={`${item.id}-${i}`} className="news-feed-item">
            <span className="news-item-icon">{item.icon}</span>
            <div className="news-item-body">
              <span className="news-item-text">{item.text}</span>
              <span className="news-item-time">{relativeTime(item.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────── */

function QuickIcon() {
  return (
    <svg viewBox="0 0 48 48" className="hub-icon hub-icon--sm" aria-hidden>
      <polygon points="10,8 14,8 10,24 20,24 8,40 12,40 28,20 18,20 26,8" fill="#e8a020" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="hub-icon" aria-hidden>
      <rect x="6"  y="28" width="8" height="14" rx="2" fill="#7a9be0" />
      <rect x="18" y="18" width="8" height="24" rx="2" fill="#7a9be0" />
      <rect x="30" y="10" width="8" height="32" rx="2" fill="#c0392b" />
      <line x1="4" y1="42" x2="44" y2="42" stroke="#333" strokeWidth="1.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="hub-icon hub-icon--sm" aria-hidden>
      <circle cx="24" cy="24" r="6" fill="none" stroke="#555" strokeWidth="2.5" />
      {[0,45,90,135,180,225,270,315].map(deg => {
        const r = Math.PI * deg / 180;
        const x1 = 24 + 10 * Math.cos(r), y1 = 24 + 10 * Math.sin(r);
        const x2 = 24 + 14 * Math.cos(r), y2 = 24 + 14 * Math.sin(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#555" strokeWidth="2.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

/* ── Screen ──────────────────────────────────────────────── */

export default function DartsHubScreen() {
  const goto = useGoto();
  const { profiles, activeProfileId } = useProfilesStore();
  const lastSetup = useLastSetupStore((s) => s.saved);
  const history = useStatisticsStore(s => s.history);

  const statsLoaded = useStatisticsStore(s => s.loaded);

  const my180s = activeProfileId ? count180s(history, activeProfileId) : 0;
  const myMPV = activeProfileId ? computeMPV(history, activeProfileId) : '—';
  const leaderboard = compute180sLeaderboard(history, profiles);
  const feedItems = generateFeedItems(history, profiles);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="hub-page">

      {/* ── Left column ── */}
      <div className="hub-col hub-col--left">

        {/* Quick Game */}
        <div className="hub-card hub-card--quick" onClick={() =>
          lastSetup
            ? goto(lastSetup.route, { state: { ...lastSetup.gameState, _from: 'hub' } })
            : goto(ROUTES.X01_SETUP, { state: { _from: 'hub' } })
        }>
          <QuickIcon />
          <div className="hub-card-text">
            <span className="hub-card-title">Quick Game</span>
            <span className="hub-card-sub">{lastSetup ? 'Continue last setup' : '501 · Jump straight in'}</span>
          </div>
        </div>

        {/* Play */}
        <div className="hub-card hub-card--play hub-card--big" onClick={() => goto(ROUTES.PLAY)}>
          <span className="hub-card-title hub-card-title--big">Play</span>
          <span className="hub-card-sub">Choose your game mode</span>
          <div className="hub-play-preview">
            <div className="hub-play-preview-grid">
              <div className="hub-play-preview-item">
                <DartIcon className="hub-play-icon" />
                <span className="hub-play-icon-label">X01</span>
              </div>
              <div className="hub-play-preview-item">
                <CricketIcon className="hub-play-icon" />
                <span className="hub-play-icon-label">Cricket</span>
              </div>
              <div className="hub-play-preview-item">
                <ClockIcon className="hub-play-icon" />
                <span className="hub-play-icon-label">ATC</span>
              </div>
              <div className="hub-play-preview-item">
                <FlagIcon className="hub-play-icon" />
                <span className="hub-play-icon-label">First To</span>
              </div>
              <div className="hub-play-preview-item">
                <BullseyeIcon className="hub-play-icon" />
                <span className="hub-play-icon-label">Free Throw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hub-card hub-card--stats hub-card--big" onClick={() => goto(ROUTES.STATS_HOME)}>
          <StatsIcon />
          <span className="hub-card-title hub-card-title--big">Stats</span>

          {!statsLoaded ? (
            <DataLoading />
          ) : (
            <>
              {leaderboard.length > 0 ? (
                <div className="hub-leaderboard">
                  <p className="hub-leader-title">Top Players</p>
                  {leaderboard.map((entry, i) => (
                    <div key={entry.name} className="hub-leader-row">
                      <span className="hub-leader-medal">{medals[i] ?? `${i + 1}.`}</span>
                      <span className="hub-leader-name">{entry.name}</span>
                      <span className="hub-leader-elo">{entry.maxes}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hub-no-data">No games played yet</p>
              )}

              {activeProfileId && (
                <div className="hub-my-stats">
                  <div className="hub-elo-row">
                    <span className="hub-elo-label">180s</span>
                    <span className="hub-elo-val">{my180s}</span>
                  </div>
                  <div className="hub-avg-row">
                    <span className="hub-avg-label">Cricket MPV</span>
                    <span className="hub-avg-val">{myMPV}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Right column ── */}
      <div className="hub-col hub-col--right">

        {/* News */}
        <div className="hub-card hub-card--news">
          <div className="news-header">
            <span className="news-header-title">Live Feed</span>
            <span className="news-pulse" />
          </div>
          {!statsLoaded ? <DataLoading /> : <NewsFeed items={feedItems} />}
        </div>

        {/* Settings */}
        <div className="hub-card hub-card--settings" onClick={() => goto(ROUTES.SETTINGS)}>
          <SettingsIcon />
          <div className="hub-card-text">
            <span className="hub-card-title">Settings</span>
            <span className="hub-card-sub">Profile &amp; stats</span>
          </div>
        </div>

      </div>

    </div>
  );
}
