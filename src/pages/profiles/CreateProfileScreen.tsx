import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { hashPassword } from '../../utils/hashPassword';
import { ROUTES } from '../../constants';

export default function CreateProfileScreen() {
  const navigate = useNavigate();
  const { addProfile, setActiveProfile, profiles } = useProfilesStore();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a username.'); return; }
    if (profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That username is already taken. Please sign in instead.');
      return;
    }
    if (!password) { setError('Please enter a password.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const hash = await hashPassword(password);
    const id = crypto.randomUUID();
    addProfile(trimmed, hash, id);
    setActiveProfile(id);
    navigate(ROUTES.HOME);
  }

  return (
    <div className="page">
      <h2>Create Profile</h2>
      <input
        placeholder="Username"
        value={name}
        onChange={(e) => { setName(e.target.value); setError(''); }}
        autoFocus
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(''); }}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setError(''); }}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      {error && <p className="profile-error">{error}</p>}
      <button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating…' : 'Create'}
      </button>
      <button className="secondary" onClick={() => navigate(ROUTES.PROFILES)}>Back</button>
    </div>
  );
}
