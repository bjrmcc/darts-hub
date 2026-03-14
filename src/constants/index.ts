export const CRICKET_NUMBERS = [15, 16, 17, 18, 19, 20, 25] as const; // 25 = bullseye

export const X01_VARIANTS = [301, 501] as const;

export const CPU_DIFFICULTY = ['easy', 'medium', 'hard'] as const;

export const ROUTES = {
  HOME: '/',
  PROFILES: '/profiles',
  CREATE_PROFILE: '/profiles/create',
  GAMEMODES: '/gamemodes',
  X01_SETUP: '/gamemodes/x01/setup',
  X01_GAME: '/gamemodes/x01/game',
  X01_RESULT: '/gamemodes/x01/result',
  CRICKET_SETUP: '/gamemodes/cricket/setup',
  CRICKET_GAME: '/gamemodes/cricket/game',
  CRICKET_RESULT: '/gamemodes/cricket/result',
  ATC_SETUP: '/gamemodes/atc/setup',
  ATC_GAME: '/gamemodes/atc/game',
  ATC_RESULT: '/gamemodes/atc/result',
  FIRST_TO_SETUP: '/gamemodes/first-to/setup',
  FIRST_TO_GAME: '/gamemodes/first-to/game',
  FIRST_TO_RESULT: '/gamemodes/first-to/result',
  PRACTICE: '/gamemodes/practice',
  STATISTICS: '/statistics',
  LEADERBOARD: '/leaderboard',
} as const;
