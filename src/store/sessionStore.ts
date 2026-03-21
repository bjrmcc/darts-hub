import { create } from 'zustand';
import { useProfilesStore } from './profilesStore';

interface SessionState {
  authenticatedIds: Set<string>;
  markAuthenticated: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  authenticatedIds: new Set<string>(),
  markAuthenticated: (id) =>
    set((state) => ({
      authenticatedIds: new Set([...state.authenticatedIds, id]),
    })),
}));

// Clear authenticated profiles whenever the logged-in user changes (login / logout)
let prevActiveProfileId = useProfilesStore.getState().activeProfileId;
useProfilesStore.subscribe((state) => {
  if (state.activeProfileId !== prevActiveProfileId) {
    prevActiveProfileId = state.activeProfileId;
    useSessionStore.setState({ authenticatedIds: new Set() });
  }
});
