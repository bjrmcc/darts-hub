import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameResult } from '../types';

interface StatisticsState {
  history: GameResult[];
  addResult: (result: GameResult) => void;
  removeResult: (id: string) => void;
  clearHistory: () => void;
  resetProfileGameMode: (profileId: string, gameMode: string) => void;
}

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set) => ({
      history: [],
      addResult: (result) =>
        set((state) => ({ history: [result, ...state.history] })),
      removeResult: (id) =>
        set((state) => ({ history: state.history.filter((r) => r.id !== id) })),
      clearHistory: () => set({ history: [] }),
      resetProfileGameMode: (profileId, gameMode) =>
        set((state) => ({
          history: state.history.filter(
            (r) => !(r.players.includes(profileId) && r.gameMode === gameMode)
          ),
        })),
    }),
    { name: 'darts-hub-statistics' }
  )
);
