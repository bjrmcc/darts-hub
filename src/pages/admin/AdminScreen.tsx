import { useState, useEffect } from 'react';
import { useGoto } from '../../hooks/useGoto';
import { ROUTES } from '../../constants';
import { useProfilesStore } from '../../store/profilesStore';
import { useStatisticsStore } from '../../store/statisticsStore';
import { hashPassword } from '../../utils/hashPassword';
import { supabase } from '../../lib/supabase';
import type { GameStats, Profile } from '../../types';

/* ── Helpers ─────────────────────────────────────────────── */

const MODE_SHORT: Record<string, string> = {
  x01: 'X01', cricket: 'CRK', aroundTheClock: 'ATC', firstTo: 'FT', practice: 'FRE',
};
const MODE_ACCENT: Record<string, string> = {
  x01: 'red', cricket: 'green', aroundTheClock: 'blue', firstTo: 'amber', practice: 'purple',
};
const GAME_MODE_KEYS = ['x01', 'cricket', 'aroundTheClock', 'firstTo', 'practice'];

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function fmtAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Export / Backup ──────────────────────────────────────── */

function exportBackup() {
  const { profiles } = useProfilesStore.getState();
  const { history } = useStatisticsStore.getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    profiles,
    gameResults: history,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `darts-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ExportSection({ profileCount, gameCount }: { profileCount: number; gameCount: number }) {
  return (
    <div className="adm-export-banner">
      <div className="adm-export-info">
        <span className="adm-export-title">Backup</span>
        <span className="adm-export-meta">
          {profileCount} profile{profileCount !== 1 ? 's' : ''} · {gameCount} game{gameCount !== 1 ? 's' : ''}
        </span>
      </div>
      <button className="adm-export-btn" onClick={exportBackup}>
        Export JSON
      </button>
    </div>
  );
}

/* ── Data Repair ──────────────────────────────────────────── */

function DataRepairSection({ profiles }: { profiles: Profile[] }) {
  const { history, repairOrphanedRecords } = useStatisticsStore();
  const profileIds = new Set(profiles.map((p) => p.id));
  const orphanCount = history.filter((r) => r.players.some((id) => !profileIds.has(id))).length;
  const [repairing, setRepairing] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  async function handleRepair() {
    setRepairing(true);
    setResult(null);
    const fixed = await repairOrphanedRecords(profiles);
    setRepairing(false);
    setResult(fixed);
  }

  if (orphanCount === 0 && result === null) return null;

  return (
    <div className="adm-repair-banner">
      <div className="adm-repair-info">
        <span className="adm-repair-title">Data Repair</span>
        {result !== null ? (
          <span className="adm-repair-msg adm-repair-msg--ok">Fixed {result} record{result !== 1 ? 's' : ''} ✓</span>
        ) : (
          <span className="adm-repair-msg">{orphanCount} game record{orphanCount !== 1 ? 's' : ''} with unrecognised player IDs</span>
        )}
      </div>
      {result === null && (
        <button className="adm-repair-btn" onClick={handleRepair} disabled={repairing}>
          {repairing ? 'Repairing…' : 'Auto-fix'}
        </button>
      )}
    </div>
  );
}

/* ── Profiles Tab ─────────────────────────────────────────── */

function ProfilesTab() {
  const { profiles, activeProfileId, removeProfile, setPasswordHash } = useProfilesStore();
  const { history } = useStatisticsStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [changingPwId, setChangingPwId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  async function handleChangePw(id: string) {
    if (!newPw) { setPwError('Enter a password.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    const hash = await hashPassword(newPw);
    setPasswordHash(id, hash);
    setChangingPwId(null);
    setNewPw(''); setConfirmPw(''); setPwError('');
    setPwSuccess(id);
    setPwSaving(false);
    setTimeout(() => setPwSuccess(null), 2500);
  }

  function openChangePw(id: string) {
    setChangingPwId(id === changingPwId ? null : id);
    setNewPw(''); setConfirmPw(''); setPwError('');
    setConfirmDeleteId(null);
  }

  return (
    <div className="adm-list">
      {profiles.map(p => {
        const gameCount = history.filter(g => g.players.includes(p.id)).length;
        const isSelf = p.id === activeProfileId;
        const isAdminProfile = p.isAdmin || p.name === 'Ross';

        return (
          <div key={p.id} className={`adm-profile-card${isSelf ? ' adm-profile-card--self' : ''}`}>
            <div className="adm-profile-row">
              <div className="adm-avatar">
                <span className="adm-avatar-text">{initials(p.name)}</span>
              </div>
              <div className="adm-profile-info">
                <div className="adm-profile-name-row">
                  <span className="adm-profile-name">{p.name}</span>
                  {isAdminProfile && <span className="adm-badge adm-badge--gold">♛ Admin</span>}
                  {isSelf && <span className="adm-badge adm-badge--green">You</span>}
                </div>
                <span className="adm-profile-meta">
                  {gameCount} game{gameCount !== 1 ? 's' : ''}
                  {p.createdAt ? ` · joined ${fmtDate(p.createdAt)}` : ''}
                </span>
                {pwSuccess === p.id && <span className="adm-pw-success">Password updated ✓</span>}
              </div>
              <div className="adm-profile-actions">
                <button
                  className={`adm-action-btn${changingPwId === p.id ? ' adm-action-btn--active' : ''}`}
                  onClick={() => openChangePw(p.id)}
                >
                  {changingPwId === p.id ? 'Cancel' : 'Password'}
                </button>
                {!isSelf && (
                  confirmDeleteId === p.id ? (
                    <>
                      <button className="adm-danger-btn adm-danger-btn--confirm" onClick={() => { removeProfile(p.id); setConfirmDeleteId(null); }}>
                        Confirm
                      </button>
                      <button className="adm-action-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="adm-danger-btn" onClick={() => { setConfirmDeleteId(p.id); setChangingPwId(null); }}>
                      Delete
                    </button>
                  )
                )}
              </div>
            </div>

            {changingPwId === p.id && (
              <div className="adm-pw-form">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwError(''); }}
                  className="adm-input"
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
                  onKeyDown={e => e.key === 'Enter' && !pwSaving && handleChangePw(p.id)}
                  className="adm-input"
                />
                {pwError && <span className="adm-error">{pwError}</span>}
                <button className="adm-save-btn" onClick={() => handleChangePw(p.id)} disabled={pwSaving}>
                  {pwSaving ? 'Saving…' : 'Save Password'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Games Tab ────────────────────────────────────────────── */

function GamesTab() {
  const { history, removeResult } = useStatisticsStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState('all');

  const filtered = modeFilter === 'all' ? history : history.filter(g => g.gameMode === modeFilter);

  return (
    <>
      <div className="adm-filter-bar">
        {['all', ...GAME_MODE_KEYS].map(key => (
          <button
            key={key}
            className={`adm-filter-pill${modeFilter === key ? ' adm-filter-pill--active' : ''}`}
            onClick={() => setModeFilter(key)}
          >
            {key === 'all' ? `All (${history.length})` : `${MODE_SHORT[key] ?? key} (${history.filter(g => g.gameMode === key).length})`}
          </button>
        ))}
      </div>

      <div className="adm-list">
        {filtered.length === 0 && <p className="adm-empty">No games recorded.</p>}
        {filtered.map(g => {
          const players = (g.stats as GameStats).players;
          const playerNames = players.map(p => p.playerName).join(' vs ');
          const winner = players.find(p => p.won)?.playerName;
          const accent = MODE_ACCENT[g.gameMode] ?? 'dim';

          return (
            <div key={g.id} className="adm-game-row">
              <span className={`adm-mode-chip adm-mode-chip--${accent}`}>
                {MODE_SHORT[g.gameMode] ?? g.gameMode}
              </span>
              <div className="adm-game-info">
                <span className="adm-game-players">{playerNames}</span>
                <span className="adm-game-meta">
                  {winner ? `${winner} won` : 'No result'}
                  <span className="adm-dot">·</span>
                  {fmtDate(g.date)}
                </span>
              </div>
              {confirmId === g.id ? (
                <div className="adm-confirm-row">
                  <button className="adm-danger-btn adm-danger-btn--confirm" onClick={() => { removeResult(g.id); setConfirmId(null); }}>
                    Confirm
                  </button>
                  <button className="adm-action-btn" onClick={() => setConfirmId(null)}>Cancel</button>
                </div>
              ) : (
                <button className="adm-danger-btn" onClick={() => setConfirmId(g.id)}>Delete</button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Diagnostics Tab ──────────────────────────────────────── */

interface ActiveSession {
  id: string;
  game_mode: string;
  player_ids: string[];
  updated_at: string;
}

function DiagnosticsTab() {
  const { profiles } = useProfilesStore();
  const { history } = useStatisticsStore();
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('game_sessions')
        .select('id, game_mode, player_ids, updated_at')
        .order('updated_at', { ascending: false });
      setSessions((data ?? []) as ActiveSession[]);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const noPassword = profiles.filter(p => !p.passwordHash);

  const byMode = GAME_MODE_KEYS.map(key => ({
    key,
    count: history.filter(g => g.gameMode === key).length,
  })).filter(r => r.count > 0);

  return (
    <div className="adm-diag">

      <div className="adm-diag-section">
        <span className="adm-diag-label">Active Sessions</span>
        {loading ? (
          <span className="adm-diag-dim">Loading…</span>
        ) : !sessions?.length ? (
          <span className="adm-diag-dim">No active sessions</span>
        ) : (
          sessions.map(s => (
            <div key={s.id} className="adm-diag-row">
              <span className={`adm-mode-chip adm-mode-chip--${MODE_ACCENT[s.game_mode] ?? 'dim'}`}>
                {MODE_SHORT[s.game_mode] ?? s.game_mode}
              </span>
              <span className="adm-diag-row-text">
                {s.player_ids.length} player{s.player_ids.length !== 1 ? 's' : ''}
              </span>
              <span className="adm-diag-row-time">{fmtAgo(s.updated_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="adm-diag-section">
        <span className="adm-diag-label">Games by Mode</span>
        {byMode.length === 0 ? (
          <span className="adm-diag-dim">No games recorded</span>
        ) : (
          byMode.map(r => (
            <div key={r.key} className="adm-diag-row">
              <span className={`adm-mode-chip adm-mode-chip--${MODE_ACCENT[r.key]}`}>
                {MODE_SHORT[r.key]}
              </span>
              <span className="adm-diag-row-text">{r.count} game{r.count !== 1 ? 's' : ''}</span>
            </div>
          ))
        )}
      </div>

      {noPassword.length > 0 && (
        <div className="adm-diag-section">
          <span className="adm-diag-label">No Password Set</span>
          {noPassword.map(p => (
            <div key={p.id} className="adm-diag-row">
              <div className="adm-avatar adm-avatar--sm">
                <span className="adm-avatar-text">{initials(p.name)}</span>
              </div>
              <span className="adm-diag-row-text">{p.name}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

/* ── Screen ───────────────────────────────────────────────── */

export default function AdminScreen() {
  const goto = useGoto();
  const { profiles, activeProfileId } = useProfilesStore();
  const { history } = useStatisticsStore();
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [tab, setTab] = useState<'profiles' | 'games' | 'diagnostics'>('profiles');

  if (!activeProfile || (activeProfile.name !== 'Ross' && !activeProfile.isAdmin)) {
    return (
      <div className="page">
        <p className="hint">Access denied.</p>
        <button className="secondary" onClick={() => goto(ROUTES.HOME)}>Back</button>
      </div>
    );
  }

  return (
    <div className="adm-page">

      {/* Header */}
      <div className="adm-header">
        <div className="adm-header-crown">♛</div>
        <div className="adm-header-text">
          <span className="adm-header-title">Admin Panel</span>
          <span className="adm-header-sub">
            {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
            <span className="adm-header-dot">·</span>
            {history.length} game{history.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="adm-back-btn" onClick={() => goto(ROUTES.HOME)}>← Hub</button>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${tab === 'profiles' ? ' adm-tab--active' : ''}`}
          onClick={() => setTab('profiles')}
        >
          Profiles
          <span className="adm-tab-count">{profiles.length}</span>
        </button>
        <button
          className={`adm-tab${tab === 'games' ? ' adm-tab--active' : ''}`}
          onClick={() => setTab('games')}
        >
          Game Log
          <span className="adm-tab-count">{history.length}</span>
        </button>
        <button
          className={`adm-tab${tab === 'diagnostics' ? ' adm-tab--active' : ''}`}
          onClick={() => setTab('diagnostics')}
        >
          Diagnostics
        </button>
      </div>

      {/* Content */}
      <div className="adm-body">
        <ExportSection profileCount={profiles.length} gameCount={history.length} />
        <DataRepairSection profiles={profiles} />
        {tab === 'profiles'    && <ProfilesTab />}
        {tab === 'games'       && <GamesTab />}
        {tab === 'diagnostics' && <DiagnosticsTab />}
      </div>

    </div>
  );
}
