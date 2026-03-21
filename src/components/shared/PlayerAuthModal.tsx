import { useState } from 'react';
import type { Profile } from '../../types';
import { hashPassword } from '../../utils/hashPassword';
import { useSessionStore } from '../../store/sessionStore';

interface Props {
  profile: Profile;
  onSuccess: (profile: Profile) => void;
  onCancel: () => void;
}

export default function PlayerAuthModal({ profile, onSuccess, onCancel }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const markAuthenticated = useSessionStore((s) => s.markAuthenticated);

  async function handleSubmit() {
    if (!password) return;
    setLoading(true);
    setError('');
    const hash = await hashPassword(password);
    if (hash === profile.passwordHash) {
      markAuthenticated(profile.id);
      onSuccess(profile);
    } else {
      setError('Incorrect password');
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onCancel}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <p className="auth-modal-name">{profile.name}</p>
        <p className="auth-modal-prompt">Enter your password to join</p>
        <input
          type="password"
          className="auth-modal-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Password"
          autoFocus
        />
        {error && <p className="auth-modal-error">{error}</p>}
        <div className="auth-modal-actions">
          <button className="auth-modal-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="auth-modal-submit"
            onClick={handleSubmit}
            disabled={!password || loading}
          >
            {loading ? '…' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
