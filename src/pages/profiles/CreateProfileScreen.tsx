import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

export default function CreateProfileScreen() {
  const navigate = useNavigate();
  const { addProfile, setActiveProfile } = useProfilesStore();
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    addProfile(name.trim(), id);
    setActiveProfile(id);
    navigate(ROUTES.HOME);
  };

  return (
    <div className="page">
      <h2>Create Profile</h2>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        autoFocus
      />
      <button onClick={handleCreate}>Create</button>
      <button className="secondary" onClick={() => navigate(ROUTES.PROFILES)}>Back</button>
    </div>
  );
}
