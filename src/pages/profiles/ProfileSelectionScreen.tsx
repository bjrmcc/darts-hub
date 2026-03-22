import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { hashPassword } from '../../utils/hashPassword';
import ProfileSearch from '../../components/shared/ProfileSearch';
import LoadingScreen from '../../components/shared/LoadingScreen';
import DataLoading from '../../components/shared/DataLoading';
import { ROUTES } from '../../constants';
import type { Profile } from '../../types';

type Step = 'search' | 'password' | 'set-password';

function formatLastActive(ts?: number): string {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function DartboardIcon() {
  const cx = 50, cy = 50;
  const rings = [
    { r: 48, fill: '#0f0f0f', stroke: '#2a2a2a' },
    { r: 42, fill: '#e8e0cc', stroke: '#333' },
    { r: 36, fill: '#111',    stroke: '#333' },
    { r: 30, fill: '#e8e0cc', stroke: '#333' },
    { r: 24, fill: '#111',    stroke: '#333' },
    { r: 18, fill: '#e8e0cc', stroke: '#333' },
    { r: 12, fill: '#111',    stroke: '#333' },
  ];
  const lines = Array.from({ length: 20 }, (_, i) => {
    const angle = (i * 18 * Math.PI) / 180;
    return {
      x1: cx + 12 * Math.cos(angle), y1: cy + 12 * Math.sin(angle),
      x2: cx + 48 * Math.cos(angle), y2: cy + 48 * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="login-dartboard" aria-hidden="true">
      {rings.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r.r} fill={r.fill} stroke={r.stroke} strokeWidth="0.5" />
      ))}
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#2a2a2a" strokeWidth="0.4" />
      ))}
      <circle cx={cx} cy={cy} r={42} fill="none" stroke="#c0392b" strokeWidth="5" opacity="0.35" />
      <circle cx={cx} cy={cy} r={26} fill="none" stroke="#c0392b" strokeWidth="5" opacity="0.35" />
      <circle cx={cx} cy={cy} r={9}   fill="#27ae60" stroke="#1a1a1a" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={4.5} fill="#c0392b" stroke="#1a1a1a" strokeWidth="0.5" />
    </svg>
  );
}

export default function ProfileSelectionScreen() {
  const navigate = useNavigate();
  const { profiles, setActiveProfile, setPasswordHash, loaded: profilesLoaded } = useProfilesStore();

  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));

  const [selected, setSelected] = useState<Profile | null>(null);
  const [step, setStep] = useState<Step>('search');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  function selectProfile(profile: Profile) {
    setSelected(profile);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setStep(profile.passwordHash ? 'password' : 'set-password');
  }

  function handleBack() {
    setSelected(null);
    setStep('search');
    setError('');
  }

  async function handleSignIn() {
    if (!selected || !password) return;
    setLoading(true);
    setError('');
    const hash = await hashPassword(password);
    if (hash !== selected.passwordHash) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }
    setActiveProfile(selected.id);
    setLoggingIn(true);
    setTimeout(() => navigate(ROUTES.HOME), 1600);
  }

  async function handleSetPassword() {
    if (!selected) return;
    if (!newPassword) { setError('Please enter a password.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const hash = await hashPassword(newPassword);
    setPasswordHash(selected.id, hash);
    setActiveProfile(selected.id);
    setLoggingIn(true);
    setTimeout(() => navigate(ROUTES.HOME), 1600);
  }

  if (loggingIn) return <LoadingScreen />;

  return (
    <div className="login-page">
      <div className="login-wrap">

        {/* Header */}
        <div className="login-header">
          <DartboardIcon />
          <h1 className="login-title">Darts Hub</h1>
        </div>

        {/* Search step */}
        {step === 'search' && (
          <div className="login-body">
            <p className="login-prompt">Select your profile</p>
            {!profilesLoaded ? (
              <DataLoading />
            ) : sorted.length === 0 ? (
              <p className="login-empty">No profiles yet — create one to get started.</p>
            ) : (
              <>
                <ProfileSearch
                  profiles={sorted}
                  onSelect={selectProfile}
                  placeholder="Search profiles…"
                />
                <button className="login-view-profiles-btn" onClick={() => setShowAllProfiles(true)}>
                  View all profiles
                </button>
              </>
            )}
          </div>
        )}

        {/* Password step */}
        {step === 'password' && selected && (
          <div className="login-card">
            <span className="login-card-name">{selected.name}</span>
            {(selected.isAdmin || selected.name === 'Ross') && (
              <span className="profile-admin-badge">Admin</span>
            )}
            <div className="login-card-divider" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              autoFocus
              className="login-input"
            />
            {error && <p className="login-error">{error}</p>}
            <button onClick={handleSignIn} disabled={!password || loading} className="login-btn">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button className="login-forgot-btn" onClick={() => setShowForgotPw(v => !v)}>
              Forgot password?
            </button>
            {showForgotPw && (
              <p className="login-forgot-msg">Please speak to an admin to reset your password.</p>
            )}
            <button className="login-back-link" onClick={() => { handleBack(); setShowForgotPw(false); }}>← Back</button>
          </div>
        )}

        {/* Set password step */}
        {step === 'set-password' && selected && (
          <div className="login-card">
            <span className="login-card-name">{selected.name}</span>
            <div className="login-card-divider" />
            <p className="login-card-hint">Create a password for your account</p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              autoFocus
              className="login-input"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
              className="login-input"
            />
            {error && <p className="login-error">{error}</p>}
            <button onClick={handleSetPassword} disabled={!newPassword || loading} className="login-btn">
              {loading ? 'Setting up…' : 'Set Password & Sign In'}
            </button>
            <button className="login-back-link" onClick={handleBack}>← Back</button>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <div className="login-footer-divider" />
          <button className="secondary" onClick={() => navigate(ROUTES.CREATE_PROFILE)}>
            Create Profile
          </button>
        </div>

      </div>

      {/* All profiles overlay */}
      {showAllProfiles && (
        <div className="profiles-overlay-backdrop" onClick={() => setShowAllProfiles(false)}>
          <div className="profiles-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="profiles-overlay-header">
              <p className="profiles-overlay-title">All Profiles</p>
              <button className="profiles-overlay-close" onClick={() => setShowAllProfiles(false)}>✕</button>
            </div>
            <div className="profiles-overlay-list">
              {sorted.map((p) => (
                <button
                  key={p.id}
                  className="profiles-overlay-item"
                  onClick={() => { setShowAllProfiles(false); selectProfile(p); }}
                >
                  <span className="profiles-overlay-name">{p.name}</span>
                  <span className="profiles-overlay-meta">
                    {(p.isAdmin || p.name === 'Ross') && (
                      <span className="profile-admin-badge">Admin</span>
                    )}
                    <span className="profiles-overlay-last">{formatLastActive(p.lastActive)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
