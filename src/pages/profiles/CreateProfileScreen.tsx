import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

export default function CreateProfileScreen() {
  const navigate = useNavigate();
  const addProfile = useProfilesStore((s) => s.addProfile);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    addProfile(name.trim());
    navigate(ROUTES.PROFILES);
  };

  return (
    <div className="page">
      <h2>Create Profile</h2>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <button onClick={handleCreate}>Create</button>
      <button onClick={() => navigate(ROUTES.PROFILES)}>Back</button>
    </div>
  );
}
