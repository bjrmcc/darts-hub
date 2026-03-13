export type GameMode = 'x01' | 'cricket' | 'aroundTheClock' | 'practice';

export type X01Variant = 301 | 501;

export type CricketMode = 'pvp' | 'vsCPU';

export type ATCMode = 'singlePlayer' | 'multiplayer';

export type CPUDifficulty = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface GameResult {
  id: string;
  gameMode: GameMode;
  players: string[]; // profile ids
  winnerId?: string;
  date: number;
  stats: Record<string, unknown>;
}
