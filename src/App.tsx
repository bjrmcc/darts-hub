import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from './constants';
import Header from './components/shared/Header';
import RequireProfile from './components/shared/RequireProfile';
import LoadingScreen from './components/shared/LoadingScreen';
import { useTransitionStore } from './store/transitionStore';
import { useProfilesStore } from './store/profilesStore';
import { useStatisticsStore } from './store/statisticsStore';

function TransitionOverlay() {
  const variant = useTransitionStore((s) => s.variant);
  if (!variant) return null;
  return <LoadingScreen quick={variant === 'quick'} />;
}

function DataBootstrap() {
  useEffect(() => {
    const { fetch: fetchProfiles, subscribe: subProfiles } = useProfilesStore.getState();
    const { fetch: fetchStats, subscribe: subStats } = useStatisticsStore.getState();
    fetchProfiles();
    fetchStats();
    const unsubProfiles = subProfiles();
    const unsubStats = subStats();
    return () => { unsubProfiles(); unsubStats(); };
  }, []);
  return null;
}

import DartsHubScreen from './pages/DartsHubScreen';
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
import FreeThrowGameScreen from './pages/gamemodes/practice/FreeThrowGameScreen';
import StatisticsScreen from './pages/statistics/StatisticsScreen';
import PersonalStatisticsScreen from './pages/statistics/PersonalStatisticsScreen';
import GeneralStatisticsScreen from './pages/statistics/GeneralStatisticsScreen';
import ProgressMenuScreen from './pages/progress/ProgressMenuScreen';
import PersonalProgressScreen from './pages/progress/PersonalProgressScreen';
import GeneralProgressScreen from './pages/progress/GeneralProgressScreen';
import LeaderboardScreen from './pages/leaderboard/LeaderboardScreen';
import X01StatsScreen from './pages/statistics/X01StatsScreen';
import CricketStatsScreen from './pages/statistics/CricketStatsScreen';
import FreeThrowStatsScreen from './pages/statistics/FreeThrowStatsScreen';
import GamemodesLeaderboardScreen from './pages/statistics/GamemodesLeaderboardScreen';
import FirstToStatsScreen from './pages/statistics/FirstToStatsScreen';
import ATCStatsScreen from './pages/statistics/ATCStatsScreen';
import StatsDetailScreen from './pages/statistics/StatsDetailScreen';
import AdminScreen from './pages/admin/AdminScreen';
import SettingsScreen from './pages/settings/SettingsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <DataBootstrap />
      <Header />
      <TransitionOverlay />
      <Routes>
        {/* Public — no profile needed */}
        <Route path={ROUTES.PROFILES} element={<ProfileSelectionScreen />} />
        <Route path={ROUTES.CREATE_PROFILE} element={<CreateProfileScreen />} />

        {/* Protected — redirects to profile login if none selected */}
        <Route path={ROUTES.HOME} element={<RequireProfile><DartsHubScreen /></RequireProfile>} />
        <Route path={ROUTES.PLAY} element={<RequireProfile><Home /></RequireProfile>} />
        <Route path={ROUTES.STATS_HOME} element={<RequireProfile><Home /></RequireProfile>} />
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
        <Route path={ROUTES.FREE_THROW_GAME} element={<RequireProfile><FreeThrowGameScreen /></RequireProfile>} />
        <Route path={ROUTES.STATISTICS} element={<RequireProfile><StatisticsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATISTICS_PERSONAL} element={<RequireProfile><PersonalStatisticsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATISTICS_GENERAL} element={<RequireProfile><GeneralStatisticsScreen /></RequireProfile>} />
        <Route path={ROUTES.PROGRESS} element={<RequireProfile><ProgressMenuScreen /></RequireProfile>} />
        <Route path={ROUTES.PROGRESS_PERSONAL} element={<RequireProfile><PersonalProgressScreen /></RequireProfile>} />
        <Route path={ROUTES.PROGRESS_GENERAL} element={<RequireProfile><GeneralProgressScreen /></RequireProfile>} />
        <Route path={ROUTES.ADMIN} element={<RequireProfile><AdminScreen /></RequireProfile>} />
        <Route path={ROUTES.SETTINGS} element={<RequireProfile><SettingsScreen /></RequireProfile>} />
        <Route path={ROUTES.LEADERBOARD} element={<RequireProfile><LeaderboardScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_X01} element={<RequireProfile><X01StatsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_GENERAL_GAMEMODES} element={<RequireProfile><GamemodesLeaderboardScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_CRICKET} element={<RequireProfile><CricketStatsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_ATC} element={<RequireProfile><ATCStatsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_FIRST_TO} element={<RequireProfile><FirstToStatsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_FREE_THROW} element={<RequireProfile><FreeThrowStatsScreen /></RequireProfile>} />
        <Route path={ROUTES.STATS_DETAIL} element={<RequireProfile><StatsDetailScreen /></RequireProfile>} />
      </Routes>
    </BrowserRouter>
  );
}
