import { useLocation } from 'react-router-dom';
import { useProfilesStore } from '../../../store/profilesStore';
import { ROUTES } from '../../../constants';
import { useGoto } from '../../../hooks/useGoto';
import { useInfoModal } from '../../../hooks/useInfoModal';
import { useLastSetupStore } from '../../../store/lastSetupStore';
import InfoModal from '../../../components/shared/InfoModal';
import { GAME_INFO } from '../../../config/gameInfoContent';

export default function PracticeScreen() {
  const goto = useGoto();
  const saveSetup = useLastSetupStore((s) => s.save);
  const { state } = useLocation();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const { open: infoOpen, close: closeInfo, reopen: openInfo } = useInfoModal('freeThrow');

  return (
    <div className="page">
      {infoOpen && <InfoModal content={GAME_INFO.freeThrow} onClose={closeInfo} />}
      <div className="page-title-row">
        <h2>Free Throw</h2>
        <button className="info-btn" onClick={openInfo} aria-label="How to play">ⓘ</button>
      </div>

      {activeProfile && (
        <div className="setup-section">
          <p className="section-label">Playing as</p>
          <div className="ft-active-player">
            <span className="player-name">
              {activeProfile.name}
              <span className="you-badge">You</span>
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          const gs = { players: activeProfile ? [activeProfile] : [] };
          saveSetup({ route: ROUTES.PRACTICE, gameState: gs });
          goto(ROUTES.FREE_THROW_GAME, { state: gs }, 'long');
        }}
      >
        Start
      </button>
      <button className="secondary" onClick={() => goto(state?._from === 'hub' ? ROUTES.HOME : ROUTES.PLAY)}>
        Back
      </button>
    </div>
  );
}
