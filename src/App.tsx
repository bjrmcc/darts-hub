import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants';
import Header from './components/shared/Header';
import RequireProfile from './components/shared/RequireProfile';

import Home from './pages/Home';
import ProfileSelectionScreen from './pages/profiles/ProfileSelectionScreen';
import CreateProfileScreen from './pages/profiles/CreateProfileScreen';
import GamemodeSelectScreen from './pages/gamemodes/GamemodeSelectScreen';
import X01SetupScreen from './pages/gamemodes/x01/X01SetupScreen';
import X01GameScreen from './pages/gamemodes/x01/X01GameScreen';
import X01ResultScreen from './pages/gamemodes/x01/X01ResultScreen';
import CricketSetupScreen from './pages/gamemodes/cricket/CricketSetupScreen';
import CricketGameScreen from './pages/gamemodes/cricket/CricketGameScreen';
import CricketResultScreen from './pages/gamemodes/cricket/CricketResultScreen';
import ATCSetupScreen from './pages/gamemodes/aroundTheClock/ATCSetupScreen';
import ATCGameScreen from './pages/gamemodes/aroundTheClock/ATCGameScreen';
import ATCResultScreen from './pages/gamemodes/aroundTheClock/ATCResultScreen';
import FirstToSetupScreen from './pages/gamemodes/firstTo/FirstToSetupScreen';
import FirstToGameScreen from './pages/gamemodes/firstTo/FirstToGameScreen';
import FirstToResultScreen from './pages/gamemodes/firstTo/FirstToResultScreen';
import PracticeScreen from './pages/gamemodes/practice/PracticeScreen';
import StatisticsScreen from './pages/statistics/StatisticsScreen';
import LeaderboardScreen from './pages/leaderboard/LeaderboardScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Public — no profile needed */}
        <Route path={ROUTES.PROFILES} element={<ProfileSelectionScreen />} />
        <Route path={ROUTES.CREATE_PROFILE} element={<CreateProfileScreen />} />

        {/* Protected — redirects to profile login if none selected */}
        <Route path={ROUTES.HOME} element={<RequireProfile><Home /></RequireProfile>} />
        <Route path={ROUTES.GAMEMODES} element={<RequireProfile><GamemodeSelectScreen /></RequireProfile>} />
        <Route path={ROUTES.X01_SETUP} element={<RequireProfile><X01SetupScreen /></RequireProfile>} />
        <Route path={ROUTES.X01_GAME} element={<RequireProfile><X01GameScreen /></RequireProfile>} />
        <Route path={ROUTES.X01_RESULT} element={<RequireProfile><X01ResultScreen /></RequireProfile>} />
        <Route path={ROUTES.CRICKET_SETUP} element={<RequireProfile><CricketSetupScreen /></RequireProfile>} />
        <Route path={ROUTES.CRICKET_GAME} element={<RequireProfile><CricketGameScreen /></RequireProfile>} />
        <Route path={ROUTES.CRICKET_RESULT} element={<RequireProfile><CricketResultScreen /></RequireProfile>} />
        <Route path={ROUTES.ATC_SETUP} element={<RequireProfile><ATCSetupScreen /></RequireProfile>} />
        <Route path={ROUTES.ATC_GAME} element={<RequireProfile><ATCGameScreen /></RequireProfile>} />
        <Route path={ROUTES.ATC_RESULT} element={<RequireProfile><ATCResultScreen /></RequireProfile>} />
        <Route path={ROUTES.FIRST_TO_SETUP} element={<RequireProfile><FirstToSetupScreen /></RequireProfile>} />
        <Route path={ROUTES.FIRST_TO_GAME} element={<RequireProfile><FirstToGameScreen /></RequireProfile>} />
        <Route path={ROUTES.FIRST_TO_RESULT} element={<RequireProfile><FirstToResultScreen /></RequireProfile>} />
        <Route path={ROUTES.PRACTICE} element={<RequireProfile><PracticeScreen /></RequireProfile>} />
        <Route path={ROUTES.STATISTICS} element={<RequireProfile><StatisticsScreen /></RequireProfile>} />
        <Route path={ROUTES.LEADERBOARD} element={<RequireProfile><LeaderboardScreen /></RequireProfile>} />
      </Routes>
    </BrowserRouter>
  );
}
