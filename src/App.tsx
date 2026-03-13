import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants';

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
import PracticeScreen from './pages/gamemodes/practice/PracticeScreen';
import StatisticsScreen from './pages/statistics/StatisticsScreen';
import LeaderboardScreen from './pages/leaderboard/LeaderboardScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.PROFILES} element={<ProfileSelectionScreen />} />
        <Route path={ROUTES.CREATE_PROFILE} element={<CreateProfileScreen />} />
        <Route path={ROUTES.GAMEMODES} element={<GamemodeSelectScreen />} />
        <Route path={ROUTES.X01_SETUP} element={<X01SetupScreen />} />
        <Route path={ROUTES.X01_GAME} element={<X01GameScreen />} />
        <Route path={ROUTES.X01_RESULT} element={<X01ResultScreen />} />
        <Route path={ROUTES.CRICKET_SETUP} element={<CricketSetupScreen />} />
        <Route path={ROUTES.CRICKET_GAME} element={<CricketGameScreen />} />
        <Route path={ROUTES.CRICKET_RESULT} element={<CricketResultScreen />} />
        <Route path={ROUTES.ATC_SETUP} element={<ATCSetupScreen />} />
        <Route path={ROUTES.ATC_GAME} element={<ATCGameScreen />} />
        <Route path={ROUTES.ATC_RESULT} element={<ATCResultScreen />} />
        <Route path={ROUTES.PRACTICE} element={<PracticeScreen />} />
        <Route path={ROUTES.STATISTICS} element={<StatisticsScreen />} />
        <Route path={ROUTES.LEADERBOARD} element={<LeaderboardScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
