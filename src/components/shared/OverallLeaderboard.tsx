import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import type { GameStats, GameResult } from '../../types';
import type { Profile } from '../../types';

interface Entry {
  id: string;
  name: string;
  maxes: number;
  mpv: number | null;
  darts: number;
}

function compute(history: GameResult[], profiles: Profile[]): Entry[] {
  const map = new Map<string, Entry>();
  const markAcc = new Map<string, { marks: number; visits: number }>();
  for (const p of profiles) {
    map.set(p.id, { id: p.id, name: p.name, maxes: 0, mpv: null, darts: 0 });
    markAcc.set(p.id, { marks: 0, visits: 0 });
  }

  for (const g of history) {
    for (const rec of (g.stats as GameStats).players) {
      const e = map.get(rec.playerId);
      if (!e) continue;
      e.darts += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;
      const visits = rec.d1.length;
      for (let i = 0; i < visits; i++)
        if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180) e.maxes++;
      if (g.gameMode !== 'x01') {
        const ma = markAcc.get(rec.playerId)!;
        ma.visits += visits;
        for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
          for (const v of arr) ma.marks += v;
      }
    }
  }

  for (const p of profiles) {
    const ma = markAcc.get(p.id)!;
    if (ma.visits > 0) map.get(p.id)!.mpv = ma.marks / ma.visits;
  }

  return Array.from(map.values())
    .filter(e => e.darts > 0)
    .sort((a, b) => b.maxes - a.maxes);
}

function RankBadge({ i }: { i: number }) {
  if (i === 0) return <span className="ldb-rank ldb-rank--gold">1</span>;
  if (i === 1) return <span className="ldb-rank ldb-rank--silver">2</span>;
  if (i === 2) return <span className="ldb-rank ldb-rank--bronze">3</span>;
  return <span className="ldb-rank">{i + 1}</span>;
}

export default function OverallLeaderboard() {
  const history = useStatisticsStore(s => s.history);
  const profiles = useProfilesStore(s => s.profiles);
  const rows = compute(history, profiles);
  const f2 = (v: number | null) => v !== null ? v.toFixed(2) : '—';

  return (
    <div className="ldb-full-wrap">
      <div className="ldb-full-card ldb-full-card--overall">
        <div className="ldb-full-title ldb-full-title--overall">Overall Leaderboard</div>
        <div className="ldb-overall-head">
          <span />
          <span>Player</span>
          <span>180s</span>
          <span>MPV</span>
          <span>Darts</span>
        </div>
        <div className="ldb-full-rows">
          {rows.length === 0 ? (
            <div className="ldb-empty" style={{ padding: '2rem 1rem' }}>No games recorded yet</div>
          ) : (
            rows.map((e, i) => (
              <div key={e.id} className="ldb-full-row ldb-full-row--5col">
                <RankBadge i={i} />
                <span className="ldb-full-name">{e.name}</span>
                <span className="ldb-full-val ldb-overall-val--180">{e.maxes || '—'}</span>
                <span className="ldb-full-val ldb-overall-val--mpv">{f2(e.mpv)}</span>
                <span className="ldb-full-val ldb-overall-val--dim">{e.darts > 0 ? e.darts.toLocaleString() : '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
