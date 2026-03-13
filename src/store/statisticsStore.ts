import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameResult } from '../types';

interface StatisticsState {
  history: GameResult[];
  addResult: (result: GameResult) => void;
  clearHistory: () => void;
}

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set) => ({
      history: [],
      addResult: (result) =>
        set((state) => ({ history: [result, ...state.history] })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: 'darts-hub-statistics' }
  )
);
