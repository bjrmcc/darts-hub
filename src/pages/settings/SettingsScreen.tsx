import { useState } from 'react';
import { useProfilesStore } from '../../store/profilesStore';
import { useStatisticsStore } from '../../store/statisticsStore';
import DataLoading from '../../components/shared/DataLoading';
import { hashPassword } from '../../utils/hashPassword';
import { ROUTES } from '../../constants';
import { useGoto } from '../../hooks/useGoto';
import type { GameResult, GameStats } from '../../types';

/* ── Helpers ──────────────────────────────────────────── */

const GAME_MODES = [
  { key: 'x01',           label: 'X01' },
  { key: 'cricket',       label: 'Cricket' },
  { key: 'aroundTheClock',label: 'Around the Clock' },
  { key: 'firstTo',       label: 'First To' },
  { key: 'practice',      label: 'Free Throw' },
] as const;

type ModeKey = typeof GAME_MODES[number]['key'];

const MODE_SHORT: Record<string, string> = {
  x01: 'X01', cricket: 'CRK', aroundTheClock: 'ATC', firstTo: 'FT', practice: 'FRE',
};
const MODE_ACCENT: Record<string, string> = {
  x01: 'red', cricket: 'green', aroundTheClock: 'blue', firstTo: 'amber', practice: 'purple',
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function turnsForProfile(history: GameResult[], profileId: string, gameMode?: string): number {
  return history
    .filter(g => g.players.includes(profileId) && (!gameMode || g.gameMode === gameMode))
    .reduce((sum, g) => {
      const ps = (g.stats as GameStats).players.find(p => p.playerId === profileId);
      return sum + (ps?.d1.length ?? 0);
    }, 0);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

/* ── Game Log Row ─────────────────────────────────────── */

function GameLogRow({ game, profileId, onDelete }: {
  game: GameResult;
  profileId?: string;
  onDelete?: (id: string) => void;
}) {
  const players = (game.stats as GameStats).players;
  const playerNames = players.map(p => p.playerName).join(' vs ');
  const winner = players.find(p => p.playerId === game.winnerId);
  const isWinner = profileId && game.winnerId === profileId;
  const accent = MODE_ACCENT[game.gameMode] ?? 'dim';

  return (
    <div className="gl-row">
      <span className={`gl-mode-chip gl-mode-chip--${accent}`}>
        {MODE_SHORT[game.gameMode] ?? game.gameMode}
      </span>
      <div className="gl-info">
        <span className="gl-players">{playerNames}</span>
        <span className="gl-meta">
          {winner ? (profileId ? (isWinner ? '✓ Won' : `${winner.playerName} won`) : `${winner.playerName} won`) : 'No result'}
          <span className="gl-dot">·</span>
          {fmtDate(game.date)}
        </span>
      </div>
      {onDelete && (
        <button className="gl-delete-btn" onClick={() => onDelete(game.id)} title="Delete game">
          ×
        </button>
      )}
    </div>
  );
}

/* ── Section: Game Log ────────────────────────────────── */

function GameLogSection({ profileId }: { profileId: string }) {
  const history = useStatisticsStore(s => s.history);
  const statsLoaded = useStatisticsStore(s => s.loaded);
  const myGames = history.filter(g => g.players.includes(profileId));

  return (
    <div className="settings-section">
      <p className="settings-section-title">My Game Log</p>
      {!statsLoaded ? (
        <DataLoading />
      ) : myGames.length === 0 ? (
        <p className="settings-hint">No games recorded yet.</p>
      ) : (
        <div className="gl-list">
          {myGames.map(g => (
            <GameLogRow key={g.id} game={g} profileId={profileId} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Section: Change Username ─────────────────────────── */

function ChangeUsernameSection({ profileId, currentName, passwordHash }: {
  profileId: string;
  currentName: string;
  passwordHash?: string;
}) {
  const { renameProfile } = useProfilesStore();
  const [newName, setNewName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!newName.trim()) { setError('Please enter a new username.'); return; }
    if (newName.trim() === currentName) { setError('That is already your username.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    const hash = await hashPassword(password);
    if (hash !== passwordHash) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }
    renameProfile(profileId, newName.trim());
    setSuccess(true);
    setNewName('');
    setPassword('');
    setLoading(false);
  }

  return (
    <div className="settings-section">
      <p className="settings-section-title">Change Username</p>
      <p className="settings-current">Current: <strong>{currentName}</strong></p>
      {success && <p className="settings-success">Username updated.</p>}
      <input
        className="settings-input"
        type="text"
        placeholder="New username"
        value={newName}
        onChange={e => { setNewName(e.target.value); setError(''); setSuccess(false); }}
      />
      <input
        className="settings-input"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={e => { setPassword(e.target.value); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      {error && <p className="settings-error">{error}</p>}
      <button
        className="settings-btn"
        onClick={handleSubmit}
        disabled={!newName || !password || loading}
      >
        {loading ? 'Saving…' : 'Update Username'}
      </button>
    </div>
  );
}

/* ── Section: Reset Stats ─────────────────────────────── */

function ResetStatsSection({ profileId, passwordHash }: {
  profileId: string;
  passwordHash?: string;
}) {
  const { resetProfileGameMode } = useStatisticsStore();
  const history = useStatisticsStore(s => s.history);
  const [confirmMode, setConfirmMode] = useState<ModeKey | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState<ModeKey | null>(null);

  function openConfirm(mode: ModeKey) {
    setConfirmMode(mode);
    setPassword('');
    setError('');
  }

  async function handleReset() {
    if (!confirmMode || !password) return;
    setLoading(true);
    setError('');
    const hash = await hashPassword(password);
    if (hash !== passwordHash) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }
    resetProfileGameMode(profileId, confirmMode);
    setResetDone(confirmMode);
    setConfirmMode(null);
    setPassword('');
    setLoading(false);
  }

  return (
    <div className="settings-section">
      <p className="settings-section-title">Reset Stats</p>
      <p className="settings-hint">Remove all your recorded games for a specific mode.</p>
      <div className="settings-reset-list">
        {GAME_MODES.map(({ key, label }) => {
          const count = history.filter(g => g.players.includes(profileId) && g.gameMode === key).length;
          return (
            <div key={key} className="settings-reset-row">
              <div className="settings-reset-info">
                <span className="settings-reset-label">{label}</span>
                <span className="settings-reset-count">{count} game{count !== 1 ? 's' : ''}</span>
              </div>
              {resetDone === key
                ? <span className="settings-reset-done">Cleared</span>
                : <button
                    className="settings-reset-btn"
                    onClick={() => openConfirm(key)}
                    disabled={count === 0}
                  >
                    Reset
                  </button>
              }
            </div>
          );
        })}
      </div>

      {confirmMode && (
        <div className="settings-confirm">
          <p className="settings-confirm-msg">
            Reset all <strong>{GAME_MODES.find(m => m.key === confirmMode)?.label}</strong> stats?
            Enter your password to confirm.
          </p>
          <input
            className="settings-input"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            autoFocus
          />
          {error && <p className="settings-error">{error}</p>}
          <div className="settings-confirm-actions">
            <button
              className="settings-reset-confirm-btn"
              onClick={handleReset}
              disabled={!password || loading}
            >
              {loading ? 'Resetting…' : 'Confirm Reset'}
            </button>
            <button className="settings-cancel-btn" onClick={() => setConfirmMode(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section: Time Spent ──────────────────────────────── */

function TimeSpentSection({ profileId }: { profileId: string }) {
  const history = useStatisticsStore(s => s.history);
  const SECS_PER_TURN = 30;

  const totalTurns = turnsForProfile(history, profileId);
  const totalSecs = totalTurns * SECS_PER_TURN;

  const rows = GAME_MODES.map(({ key, label }) => ({
    label,
    secs: turnsForProfile(history, profileId, key) * SECS_PER_TURN,
    games: history.filter(g => g.players.includes(profileId) && g.gameMode === key).length,
  })).filter(r => r.games > 0);

  return (
    <div className="settings-section">
      <p className="settings-section-title">Time Spent Playing</p>
      <div className="settings-time-total">
        <span className="settings-time-val">{formatTime(totalSecs)}</span>
        <span className="settings-time-label">estimated total</span>
      </div>
      {rows.length > 0 && (
        <div className="settings-time-rows">
          {rows.map(r => (
            <div key={r.label} className="settings-time-row">
              <span className="settings-time-mode">{r.label}</span>
              <span className="settings-time-mode-val">{formatTime(r.secs)}</span>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 && <p className="settings-hint">No games played yet.</p>}
      <p className="settings-hint settings-hint--small">Based on ~30 seconds per visit.</p>
    </div>
  );
}

/* ── Screen ───────────────────────────────────────────── */

export default function SettingsScreen() {
  const goto = useGoto();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  if (!activeProfile) return null;

  return (
    <div className="settings-page">
      <div className="settings-wrap">

        <ChangeUsernameSection
          profileId={activeProfile.id}
          currentName={activeProfile.name}
          passwordHash={activeProfile.passwordHash}
        />
        <ResetStatsSection
          profileId={activeProfile.id}
          passwordHash={activeProfile.passwordHash}
        />
        <TimeSpentSection profileId={activeProfile.id} />
        <GameLogSection profileId={activeProfile.id} />

        <button className="secondary settings-back-btn" onClick={() => goto(ROUTES.HOME)}>
          ← Back
        </button>
      </div>
    </div>
  );
}
