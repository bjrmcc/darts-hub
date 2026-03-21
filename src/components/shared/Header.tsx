import { useNavigate, useLocation } from 'react-router-dom';
import { useProfilesStore, isAdmin } from '../../store/profilesStore';
import { ROUTES } from '../../constants';
import { useGoto } from '../../hooks/useGoto';

const AUTH_ROUTES = [ROUTES.PROFILES, ROUTES.CREATE_PROFILE];

export default function Header() {
  const navigate = useNavigate();
  const goto = useGoto();
  const location = useLocation();
  const { profiles, activeProfileId, setActiveProfile } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  if (AUTH_ROUTES.includes(location.pathname as (typeof AUTH_ROUTES)[number])) return null;

  const isHubChild = location.pathname !== ROUTES.HOME;

  function handleSignOut() {
    setActiveProfile(null);
    navigate(ROUTES.PROFILES);
  }

  return (
    <header className="app-header">
      <div className="header-left">
        {isHubChild ? (
          <button className="header-title-btn" onClick={() => goto(ROUTES.HOME)} aria-label="Back to Darts Hub">
            ← Darts Hub
          </button>
        ) : (
          <span className="header-title">Darts Hub</span>
        )}
      </div>
      <div className="header-actions">
        {activeProfile ? (
          <>
            <span className="header-username">{activeProfile.name}</span>
            {isAdmin(activeProfile) && (
              <button className="header-btn admin-btn" onClick={() => goto(ROUTES.ADMIN)}>
                Admin
              </button>
            )}
            <button className="header-btn signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="header-btn signin-btn" onClick={() => goto(ROUTES.PROFILES)}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
