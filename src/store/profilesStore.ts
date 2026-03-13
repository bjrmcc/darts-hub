import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '../types';

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
  addProfile: (name: string) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (name) =>
        set((state) => ({
          profiles: [
            ...state.profiles,
            { id: crypto.randomUUID(), name, createdAt: Date.now() },
          ],
        })),
      removeProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        })),
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    { name: 'darts-hub-profiles' }
  )
);
