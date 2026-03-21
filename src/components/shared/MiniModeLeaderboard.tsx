import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import type { GameStats, GameResult } from '../../types';
import type { Profile } from '../../types';

type Mode = 'x01' | 'cricket' | 'aroundTheClock' | 'firstTo';

interface Row { name: string; val: string; sub: string; }

function computeRows(history: GameResult[], profiles: Profile[], mode: Mode): Row[] {
  type Acc = { marks: number; visits: number; score: number; legs: number };
  const acc = new Map<string, Acc>();
  for (const p of profiles) acc.set(p.id, { marks: 0, visits: 0, score: 0, legs: 0 });

  for (const g of history) {
    if (g.gameMode !== mode) continue;
    for (const rec of (g.stats as GameStats).players) {
      const a = acc.get(rec.playerId);
      if (!a) continue;
      a.legs++;
      const visits = rec.d1.length;
      a.visits += visits;
      if (mode === 'x01') {
        for (let i = 0; i < visits; i++)
          a.score += (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
      } else {
        for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
          for (const v of arr) a.marks += v;
      }
    }
  }

  const rows: Row[] = [];
  for (const p of profiles) {
    const a = acc.get(p.id)!;
    if (a.legs === 0) continue;
    if (mode === 'x01') {
      const avg = a.visits > 0 ? a.score / a.visits : null;
      if (avg === null) continue;
      rows.push({ name: p.name, val: avg.toFixed(2), sub: `${a.legs}L` });
    } else if (mode === 'aroundTheClock') {
      const va = a.legs > 0 ? a.visits / a.legs : null;
      if (va === null) continue;
      rows.push({ name: p.name, val: va.toFixed(1), sub: `${a.legs}G` });
    } else {
      const mpv = a.visits > 0 ? a.marks / a.visits : null;
      if (mpv === null) continue;
      rows.push({ name: p.name, val: mpv.toFixed(2), sub: `${a.legs}G` });
    }
  }

  if (mode === 'aroundTheClock') {
    rows.sort((a, b) => parseFloat(a.val) - parseFloat(b.val));
  } else {
    rows.sort((a, b) => parseFloat(b.val) - parseFloat(a.val));
  }
  return rows;
}

const CONFIG: Record<Mode, { title: string; accent: string }> = {
  x01:            { title: 'X01 · 3-Dart Average', accent: 'x01' },
  cricket:        { title: 'Cricket · Marks Per Visit', accent: 'crk' },
  aroundTheClock: { title: 'Around the Clock · Visit Avg', accent: 'atc' },
  firstTo:        { title: 'First To · Marks Per Visit', accent: 'ft'  },
};

function RankBadge({ i }: { i: number }) {
  if (i === 0) return <span className="ldb-rank ldb-rank--gold">1</span>;
  if (i === 1) return <span className="ldb-rank ldb-rank--silver">2</span>;
  if (i === 2) return <span className="ldb-rank ldb-rank--bronze">3</span>;
  return <span className="ldb-rank">{i + 1}</span>;
}

export default function ModeLeaderboard({ mode }: { mode: Mode }) {
  const history = useStatisticsStore(s => s.history);
  const profiles = useProfilesStore(s => s.profiles);
  const { title, accent } = CONFIG[mode];
  const rows = computeRows(history, profiles, mode);

  return (
    <div className="ldb-full-wrap">
      <div className={`ldb-full-card ldb-mode-card--${accent}`}>
        <div className={`ldb-full-title ldb-mode-title--${accent}`}>{title}</div>
        <div className="ldb-full-rows">
          {rows.length === 0 ? (
            <div className="ldb-empty" style={{ padding: '2rem 1rem' }}>No data yet</div>
          ) : (
            rows.map((r, i) => (
              <div key={r.name} className="ldb-full-row">
                <RankBadge i={i} />
                <span className="ldb-full-name">{r.name}</span>
                <span className={`ldb-full-val ldb-mode-val--${accent}`}>{r.val}</span>
                <span className="ldb-full-sub">{r.sub}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
