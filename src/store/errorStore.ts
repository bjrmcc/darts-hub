import { create } from 'zustand';

interface ErrorState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

/** Call from outside React components (stores, async callbacks). */
export function showError(message: string): void {
  useErrorStore.getState().show(message);
}
