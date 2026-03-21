import { useState } from 'react';
import type { Profile } from '../../types';
import { useProfilesStore } from '../../store/profilesStore';
import { useSessionStore } from '../../store/sessionStore';
import { hashPassword } from '../../utils/hashPassword';
import PlayerAuthModal from './PlayerAuthModal';

interface Props {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  requireAuth: boolean;
  label?: string;
}

type Mode = 'list' | 'create' | 'guest';

export default function PlayerPicker({ profiles, onSelect, requireAuth, label = '+ Add Player' }: Props) {
  const { activeProfileId, addProfile } = useProfilesStore();
  const authenticatedIds = useSessionStore((s) => s.authenticatedIds);
  const markAuthenticated = useSessionStore((s) => s.markAuthenticated);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('list');
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Profile | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm, setNewConfirm] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Guest form state
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState('');

  const filtered = query.trim()
    ? profiles.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : profiles;

  function close() {
    setOpen(false);
    setMode('list');
    setQuery('');
    setNewName('');
    setNewPassword('');
    setNewConfirm('');
    setCreateError('');
    setGuestName('');
    setGuestError('');
  }

  function handleAddGuest() {
    const name = guestName.trim() || 'Guest';
    const guest: Profile = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    onSelect(guest);
    close();
  }

  function handleSelect(profile: Profile) {
    const alreadyAuthed =
      !requireAuth ||
      profile.id === activeProfileId ||
      authenticatedIds.has(profile.id);

    if (alreadyAuthed) {
      onSelect(profile);
      close();
    } else {
      setPending(profile);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name)            { setCreateError('Please enter a username.'); return; }
    if (!newPassword)     { setCreateError('Please enter a password.'); return; }
    if (newPassword !== newConfirm) { setCreateError('Passwords do not match.'); return; }

    setCreating(true);
    setCreateError('');

    const allProfiles = useProfilesStore.getState().profiles;
    if (allProfiles.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setCreateError('That name is already taken.');
      setCreating(false);
      return;
    }

    const hash = await hashPassword(newPassword);
    const id = crypto.randomUUID();
    addProfile(name, hash, id);

    const newProfile: Profile = {
      id,
      name,
      createdAt: Date.now(),
      passwordHash: hash,
      isAdmin: name === 'Ross',
    };

    markAuthenticated(id);
    onSelect(newProfile);
    close();
    setCreating(false);
  }

  return (
    <>
      <button className="player-picker-trigger" onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && !pending && (
        <div className="auth-overlay" onClick={close}>
          <div className="picker-modal" onClick={(e) => e.stopPropagation()}>

            {mode === 'list' && (
              <>
                <p className="picker-modal-title">Add Player</p>
                <input
                  className="picker-modal-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search profiles…"
                  autoFocus
                />
                <div className="picker-modal-list">
                  {filtered.length === 0 ? (
                    <p className="picker-modal-empty">No profiles found</p>
                  ) : (
                    filtered.map((p) => (
                      <button key={p.id} className="picker-modal-row" onClick={() => handleSelect(p)}>
                        <span className="picker-modal-name">{p.name}</span>
                        {(p.isAdmin || p.name === 'Ross') && (
                          <span className="profile-admin-badge">Admin</span>
                        )}
                        {requireAuth && p.id !== activeProfileId && !authenticatedIds.has(p.id) && (
                          <span className="picker-modal-lock">🔒</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="picker-modal-footer-btns">
                  <button className="picker-modal-create-btn" onClick={() => setMode('create')}>
                    + Create Profile
                  </button>
                  <button className="picker-modal-create-btn" onClick={() => setMode('guest')}>
                    + Add Guest
                  </button>
                </div>
                <button className="auth-modal-cancel" onClick={close}>Cancel</button>
              </>
            )}

            {mode === 'create' && (
              <>
                <p className="picker-modal-title">Create Profile</p>
                <input
                  className="picker-modal-search"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(''); }}
                  placeholder="Username"
                  autoFocus
                />
                <input
                  className="picker-modal-search"
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setCreateError(''); }}
                  placeholder="Password"
                />
                <input
                  className="picker-modal-search"
                  type="password"
                  value={newConfirm}
                  onChange={(e) => { setNewConfirm(e.target.value); setCreateError(''); }}
                  placeholder="Confirm password"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                {createError && <p className="auth-modal-error">{createError}</p>}
                <div className="auth-modal-actions">
                  <button className="auth-modal-cancel" onClick={() => { setMode('list'); setNewName(''); setNewPassword(''); setNewConfirm(''); setCreateError(''); }}>
                    Back
                  </button>
                  <button
                    className="auth-modal-submit"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? '…' : 'Create & Join'}
                  </button>
                </div>
              </>
            )}

            {mode === 'guest' && (
              <>
                <p className="picker-modal-title">Add Guest</p>
                <p className="auth-modal-prompt">No account needed — stats won't be recorded</p>
                <input
                  className="picker-modal-search"
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setGuestError(''); }}
                  placeholder="Guest name (optional)"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                />
                {guestError && <p className="auth-modal-error">{guestError}</p>}
                <div className="auth-modal-actions">
                  <button className="auth-modal-cancel" onClick={() => { setMode('list'); setGuestName(''); setGuestError(''); }}>
                    Back
                  </button>
                  <button className="auth-modal-submit" onClick={handleAddGuest}>
                    Add Guest
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {pending && (
        <PlayerAuthModal
          profile={pending}
          onSuccess={(p) => { setPending(null); onSelect(p); close(); }}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
