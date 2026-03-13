import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

export default function ProfileSelectionScreen() {
  const navigate = useNavigate();
  const { profiles, activeProfileId, setActiveProfile, removeProfile } = useProfilesStore();

  return (
    <div className="page">
      <h2>Profiles</h2>
      {profiles.length === 0 && <p>No profiles yet. Create one to get started.</p>}
      <ul>
        {profiles.map((p) => (
          <li key={p.id} style={{ fontWeight: p.id === activeProfileId ? 'bold' : 'normal' }}>
            {p.name}
            <button onClick={() => setActiveProfile(p.id)}>Select</button>
            <button onClick={() => removeProfile(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={() => navigate(ROUTES.CREATE_PROFILE)}>+ New Profile</button>
      <button onClick={() => navigate(ROUTES.HOME)}>Back</button>
    </div>
  );
}
