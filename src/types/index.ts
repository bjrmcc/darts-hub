export type GameMode = 'x01' | 'cricket' | 'aroundTheClock' | 'firstTo' | 'practice';

export type X01Variant = 301 | 501;

export type CricketMode = 'pvp' | 'vsCPU';

export type ATCMode = 'singlePlayer' | 'multiplayer';

export type CPUDifficulty = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  lastActive?: number;
  passwordHash?: string;
  isAdmin?: boolean;
}

export interface PlayerDartStats {
  playerId: string;
  playerName: string;
  d1: number[]; // scores of each 1st dart per turn (0 = miss)
  d2: number[]; // scores of each 2nd dart per turn
  d3: number[]; // scores of each 3rd dart per turn
  d1m: number[]; // multiplier of each 1st dart (0 = miss, 1/2/3 otherwise)
  d2m: number[]; // multiplier of each 2nd dart
  d3m: number[]; // multiplier of each 3rd dart
  won: boolean;
  checkout?: { value: number; darts: string[] }; // X01 only
}

export interface GameStats {
  players: PlayerDartStats[];
}

export interface GameResult {
  id: string;
  gameMode: GameMode;
  players: string[]; // profile ids
  winnerId?: string;
  date: number;
  stats: GameStats;
  meta?: Record<string, unknown>; // game-mode-specific metadata
}
