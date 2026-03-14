import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

export default function ProfileSelectionScreen() {
  const navigate = useNavigate();
  const { profiles, setActiveProfile } = useProfilesStore();

  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? '');

  function handleSignIn() {
    if (!selectedId) return;
    setActiveProfile(selectedId);
    navigate(ROUTES.HOME);
  }

  return (
    <div className="page">
      <h1>Darts Hub</h1>

      {profiles.length === 0 ? (
        <p className="hint">No profiles yet — create one to get started.</p>
      ) : (
        <>
          <select
            className="profile-dropdown"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button onClick={handleSignIn} disabled={!selectedId}>Sign In</button>
        </>
      )}

      <button className="secondary" onClick={() => navigate(ROUTES.CREATE_PROFILE)}>
        Create Profile
      </button>
    </div>
  );
}
