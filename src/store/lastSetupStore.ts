import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedSetup {
  route: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: Record<string, any>;
}

interface LastSetupState {
  saved: SavedSetup | null;
  save: (setup: SavedSetup) => void;
}

export const useLastSetupStore = create<LastSetupState>()(
  persist(
    (set) => ({
      saved: null,
      save: (setup) => set({ saved: setup }),
    }),
    { name: 'last-setup-v2' },
  ),
);
