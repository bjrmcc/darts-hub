import { useNavigate, useLocation } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';

const AUTH_ROUTES = [ROUTES.PROFILES, ROUTES.CREATE_PROFILE];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profiles, activeProfileId, setActiveProfile } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  if (AUTH_ROUTES.includes(location.pathname as typeof ROUTES[keyof typeof ROUTES])) return null;

  function handleSignOut() {
    setActiveProfile(null);
    navigate(ROUTES.PROFILES);
  }

  return (
    <header className="app-header">
      <span className="header-title" onClick={() => navigate(activeProfile ? ROUTES.HOME : ROUTES.PROFILES)}>
        Darts Hub
      </span>
      <div className="header-actions">
        {activeProfile ? (
          <>
            <span className="header-username">{activeProfile.name}</span>
            <button className="header-btn signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="header-btn signin-btn" onClick={() => navigate(ROUTES.PROFILES)}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
