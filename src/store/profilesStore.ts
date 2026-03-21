import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '../types';

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
  addProfile: (name: string, passwordHash: string, id?: string) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  setPasswordHash: (id: string, hash: string) => void;
  renameProfile: (id: string, name: string) => void;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (name, passwordHash, id) =>
        set((state) => ({
          profiles: [
            ...state.profiles,
            {
              id: id ?? crypto.randomUUID(),
              name,
              createdAt: Date.now(),
              passwordHash,
              isAdmin: name === 'Ross',
            },
          ],
        })),
      removeProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        })),
      setActiveProfile: (id) =>
        id
          ? set((state) => ({
              activeProfileId: id,
              profiles: state.profiles.map((p) =>
                p.id === id ? { ...p, lastActive: Date.now() } : p
              ),
            }))
          : set({ activeProfileId: null }),
      setPasswordHash: (id, hash) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, passwordHash: hash } : p
          ),
        })),
      renameProfile: (id, name) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        })),
    }),
    {
      name: 'darts-hub-profiles',
      // Only persist profiles — activeProfileId is session-only (must log in each visit)
      partialize: (state) => ({ profiles: state.profiles }),
    }
  )
);

export function isAdmin(profile: Profile | undefined): boolean {
  if (!profile) return false;
  return profile.isAdmin === true || profile.name === 'Ross';
}
