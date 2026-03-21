import { create } from 'zustand';

export type TransitionVariant = 'quick' | 'long';

interface TransitionState {
  variant: TransitionVariant | null;
  setVariant: (v: TransitionVariant | null) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  variant: null,
  setVariant: (variant) => set({ variant }),
}));

export const TRANSITION_DELAYS: Record<TransitionVariant, number> = {
  quick: 200,
  long: 1200,
};
