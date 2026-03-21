import { useState } from 'react';
import type { Profile } from '../../types';

interface Props {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  placeholder?: string;
}

export default function ProfileSearch({ profiles, onSelect, placeholder = 'Search players…' }: Props) {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? profiles.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  function handleSelect(profile: Profile) {
    onSelect(profile);
    setQuery('');
  }

  return (
    <div className="profile-search">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="profile-search-input"
      />
      {results.length > 0 && (
        <div className="profile-search-results">
          {results.map((p) => (
            <button key={p.id} className="profile-search-result" onClick={() => handleSelect(p)}>
              <span>{p.name}</span>
              {(p.isAdmin || p.name === 'Ross') && (
                <span className="profile-admin-badge">Admin</span>
              )}
            </button>
          ))}
        </div>
      )}
      {query.trim() !== '' && results.length === 0 && (
        <p className="profile-search-empty">No profiles found</p>
      )}
    </div>
  );
}
