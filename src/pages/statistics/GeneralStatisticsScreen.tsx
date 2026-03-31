import { useStatisticsStore } from '../../store/statisticsStore';
import { useProfilesStore } from '../../store/profilesStore';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import DataLoading from '../../components/shared/DataLoading';
import type { GameStats, GameResult } from '../../types';
import type { Profile } from '../../types';

/* ── Data types ──────────────────────────────────────────── */

interface MainEntry   { id: string; name: string; maxes: number; mpv: number|null; darts: number; }
interface X01Entry    { id: string; name: string; avg: number|null; legs: number; }
interface CrkEntry    { id: string; name: string; mpv: number|null; games: number; }
interface AtcEntry    { id: string; name: string; visitAvg: number|null; games: number; }
interface FtEntry     { id: string; name: string; mpv: number|null; games: number; }

/* ── Compute ─────────────────────────────────────────────── */

function computeAll(history: GameResult[], profiles: Profile[]) {
  const main  = new Map<string, MainEntry>();
  const x01   = new Map<string, X01Entry>();
  const crk   = new Map<string, CrkEntry>();
  const atc   = new Map<string, AtcEntry>();
  const ft    = new Map<string, FtEntry>();

  for (const p of profiles) {
    main.set(p.id,  { id: p.id, name: p.name, maxes: 0, mpv: null, darts: 0 });
    x01.set(p.id,   { id: p.id, name: p.name, avg: null, legs: 0 });
    crk.set(p.id,   { id: p.id, name: p.name, mpv: null, games: 0 });
    atc.set(p.id,   { id: p.id, name: p.name, visitAvg: null, games: 0 });
    ft.set(p.id,    { id: p.id, name: p.name, mpv: null, games: 0 });
  }

  const markAcc   = new Map<string, { marks: number; visits: number }>();
  const x01Acc    = new Map<string, { score: number; visits: number }>();
  const crkAcc    = new Map<string, { marks: number; visits: number }>();
  const atcAcc    = new Map<string, { visits: number }>();
  const ftAcc     = new Map<string, { marks: number; visits: number }>();
  for (const p of profiles) {
    markAcc.set(p.id, { marks: 0, visits: 0 });
    x01Acc.set(p.id,  { score: 0, visits: 0 });
    crkAcc.set(p.id,  { marks: 0, visits: 0 });
    atcAcc.set(p.id,  { visits: 0 });
    ftAcc.set(p.id,   { marks: 0, visits: 0 });
  }

  for (const g of history) {
    for (const rec of (g.stats as GameStats).players) {
      const pid = rec.playerId;
      if (!main.has(pid)) continue;
      main.get(pid)!.darts += (rec.d1m ?? []).length + (rec.d2m ?? []).length + (rec.d3m ?? []).length;
      const visits = rec.d1.length;
      // 180s count across all game modes
      for (let i = 0; i < visits; i++)
        if ((rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0) === 180)
          main.get(pid)!.maxes++;

      if (g.gameMode === 'x01') {
        x01.get(pid)!.legs += 1;
        const xa = x01Acc.get(pid)!;
        for (let i = 0; i < visits; i++) {
          const s = (rec.d1[i] ?? 0) + (rec.d2[i] ?? 0) + (rec.d3[i] ?? 0);
          xa.score += s; xa.visits++;
        }
      } else {
        const ma = markAcc.get(pid)!;
        ma.visits += visits;
        for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
          for (const v of arr) ma.marks += v;
        if (g.gameMode === 'cricket') {
          crk.get(pid)!.games += 1;
          const ca = crkAcc.get(pid)!;
          ca.visits += visits;
          for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
            for (const v of arr) ca.marks += v;
        } else if (g.gameMode === 'aroundTheClock') {
          atc.get(pid)!.games += 1;
          atcAcc.get(pid)!.visits += visits;
        } else if (g.gameMode === 'firstTo') {
          ft.get(pid)!.games += 1;
          const fa = ftAcc.get(pid)!;
          fa.visits += visits;
          for (const arr of [rec.d1m ?? [], rec.d2m ?? [], rec.d3m ?? []] as number[][])
            for (const v of arr) fa.marks += v;
        }
      }
    }
  }

  for (const p of profiles) {
    const ma = markAcc.get(p.id)!;
    if (ma.visits > 0) main.get(p.id)!.mpv = ma.marks / ma.visits;
    const xa = x01Acc.get(p.id)!;
    if (xa.visits > 0) x01.get(p.id)!.avg = xa.score / xa.visits;
    const ca = crkAcc.get(p.id)!;
    if (ca.visits > 0) crk.get(p.id)!.mpv = ca.marks / ca.visits;
    const aa = atcAcc.get(p.id)!;
    const atcGames = atc.get(p.id)!.games;
    if (atcGames > 0) atc.get(p.id)!.visitAvg = aa.visits / atcGames;
    const fa = ftAcc.get(p.id)!;
    if (fa.visits > 0) ft.get(p.id)!.mpv = fa.marks / fa.visits;
  }

  const hasAny = (id: string) => main.get(id)!.darts > 0;
  const mainList  = Array.from(main.values()).filter(e => hasAny(e.id)).sort((a, b) => b.maxes - a.maxes);
  const x01List   = Array.from(x01.values()).filter(e => e.legs > 0 && e.avg !== null).sort((a, b) => b.avg! - a.avg!);
  const crkList   = Array.from(crk.values()).filter(e => e.games > 0 && e.mpv !== null).sort((a, b) => b.mpv! - a.mpv!);
  const atcList   = Array.from(atc.values()).filter(e => e.games > 0 && e.visitAvg !== null).sort((a, b) => a.visitAvg! - b.visitAvg!);
  const ftList    = Array.from(ft.values()).filter(e => e.games > 0 && e.mpv !== null).sort((a, b) => b.mpv! - a.mpv!);

  return { mainList, x01List, crkList, atcList, ftList };
}

/* ── Mode section card ───────────────────────────────────── */

function RankCell({ i }: { i: number }) {
  if (i === 0) return <span className="ldb-rank ldb-rank--gold">1</span>;
  if (i === 1) return <span className="ldb-rank ldb-rank--silver">2</span>;
  if (i === 2) return <span className="ldb-rank ldb-rank--bronze">3</span>;
  return <span className="ldb-rank">{i + 1}</span>;
}

function ModeLdbCard({ title, accent, rows, onClick }: {
  title: string;
  accent: string;
  rows: { name: string; val: string; sub?: string }[];
  onClick?: () => void;
}) {
  return (
    <button className={`ldb-mode-card ldb-mode-card--${accent} ldb-mode-card--btn`} onClick={onClick}>
      <div className={`ldb-mode-title ldb-mode-title--${accent}`}>{title}</div>
      <div className="ldb-mode-rows">
        {rows.length === 0 ? (
          <div className="ldb-empty">No data yet</div>
        ) : (
          rows.map((r, i) => (
            <div key={r.name} className="ldb-mode-row">
              <RankCell i={i} />
              <span className="ldb-mode-name">{r.name}</span>
              <span className={`ldb-mode-val ldb-mode-val--${accent}`}>{r.val}</span>
              {r.sub && <span className="ldb-mode-sub">{r.sub}</span>}
            </div>
          ))
        )}
      </div>
    </button>
  );
}

/* ── Screen ──────────────────────────────────────────────── */

export default function GeneralStatisticsScreen() {
  const goto = useGoto();
  const history = useStatisticsStore(s => s.history);
  const statsLoaded = useStatisticsStore(s => s.loaded);
  const profiles = useProfilesStore(s => s.profiles);

  const { mainList, x01List, crkList, atcList, ftList } = computeAll(history, profiles);

  const f2 = (v: number|null) => v !== null ? v.toFixed(2) : '—';
  const f1 = (v: number|null) => v !== null ? v.toFixed(1) : '—';

  // Pad overall to top 5, mode lists to top 1
  const OVERALL_COUNT = 5;
  const paddedMain = [
    ...mainList.slice(0, OVERALL_COUNT),
    ...Array(Math.max(0, OVERALL_COUNT - mainList.length)).fill(null),
  ] as (MainEntry | null)[];

  function topOne<T extends { name: string }>(
    list: T[],
    mapper: (e: T) => { name: string; val: string; sub?: string },
  ): { name: string; val: string; sub?: string }[] {
    if (list.length === 0) return [{ name: 'N/A', val: '—' }];
    return [mapper(list[0])];
  }

  return (
    <div className="ldb-screen">

      <div className="ss-screen-header ss-screen-header--overall">
        <button className="ss-back-btn" onClick={() => goto(ROUTES.STATS_HOME)}>←</button>
        <span className="ss-screen-title">Leaderboards</span>
      </div>

      {!statsLoaded ? (
        <DataLoading />
      ) : (
        <>
          {/* ── Overall leaderboard preview ── */}
          <button
            className="ldb-mode-card ldb-mode-card--overall ldb-mode-card--btn ldb-overall-preview"
            onClick={() => goto(ROUTES.STATS_DETAIL, { state: { leaderboard: true } })}
          >
            <div className="ldb-mode-title ldb-mode-title--overall">
              Overall Leaderboard
              <span className="ldb-overall-preview-tap">Full stats →</span>
            </div>
            <div className="ldb-overall-preview-head">
              <span /><span />
              <span>180s</span>
              <span>MPV</span>
              <span>Darts</span>
            </div>
            <div className="ldb-mode-rows">
              {paddedMain.map((e, i) => (
                <div key={e?.id ?? `empty-${i}`} className="ldb-overall-preview-row">
                  <RankCell i={i} />
                  <span className="ldb-mode-name">{e?.name ?? 'N/A'}</span>
                  <span className="ldb-mode-val ldb-overall-val--180">{e ? (e.maxes || '—') : '—'}</span>
                  <span className="ldb-mode-val ldb-overall-val--mpv">{e ? f2(e.mpv) : '—'}</span>
                  <span className="ldb-mode-val ldb-overall-val--dim">
                    {e ? (e.darts > 0 ? e.darts.toLocaleString() : '—') : '—'}
                  </span>
                </div>
              ))}
            </div>
          </button>

          {/* ── Mode leaderboards ── */}
          <div className="ldb-modes-wrap">
            <div className="ss-section-title" style={{ padding: '0 0.85rem' }}>By Game Mode</div>
            <div className="ldb-mode-grid">
              <ModeLdbCard
                title="X01 · 3-Dart Avg"
                accent="x01"
                rows={topOne(x01List, e => ({ name: e.name, val: f2(e.avg), sub: `${e.legs}L` }))}
                onClick={() => goto(ROUTES.STATS_X01, { state: { leaderboard: true } })}
              />
              <ModeLdbCard
                title="Cricket · MPV"
                accent="crk"
                rows={topOne(crkList, e => ({ name: e.name, val: f2(e.mpv), sub: `${e.games}G` }))}
                onClick={() => goto(ROUTES.STATS_CRICKET, { state: { leaderboard: true } })}
              />
              <ModeLdbCard
                title="ATC · Visit Avg"
                accent="atc"
                rows={topOne(atcList, e => ({ name: e.name, val: f1(e.visitAvg), sub: `${e.games}G` }))}
                onClick={() => goto(ROUTES.STATS_ATC, { state: { leaderboard: true } })}
              />
              <ModeLdbCard
                title="First To · MPV"
                accent="ft"
                rows={topOne(ftList, e => ({ name: e.name, val: f2(e.mpv), sub: `${e.games}G` }))}
                onClick={() => goto(ROUTES.STATS_FIRST_TO, { state: { leaderboard: true } })}
              />
            </div>
          </div>
        </>
      )}

    </div>
  );
}
