import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  addProfile: (name: string, passwordHash: string, id?: string) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  setPasswordHash: (id: string, hash: string) => void;
  renameProfile: (id: string, name: string) => void;
  subscribe: () => () => void;
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    passwordHash: (row.password_hash as string | null) ?? undefined,
    isAdmin: (row.is_admin as boolean | null) ?? false,
    avatar: (row.avatar as string | null) ?? undefined,
    createdAt: new Date(row.created_at as string).getTime(),
    lastActive: row.last_active ? new Date(row.last_active as string).getTime() : undefined,
  };
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  loaded: false,

  fetch: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('profiles fetch:', error); return; }
    set({ profiles: (data ?? []).map(rowToProfile), loaded: true });
  },

  addProfile: (name, passwordHash, id) => {
    const newId = id ?? crypto.randomUUID();
    const profile: Profile = {
      id: newId,
      name,
      passwordHash,
      isAdmin: name === 'Ross',
      createdAt: Date.now(),
    };
    // Optimistic update
    set((s) => ({ profiles: [...s.profiles, profile] }));
    // Persist to Supabase
    supabase.from('profiles').insert({
      id: newId,
      name,
      password_hash: passwordHash,
      is_admin: name === 'Ross',
    }).then(({ error }) => {
      if (error) console.error('profiles insert:', error);
    });
  },

  removeProfile: (id) => {
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
    }));
    supabase.from('profiles').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('profiles delete:', error);
    });
  },

  setActiveProfile: (id) => {
    if (id) {
      set((s) => ({
        activeProfileId: id,
        profiles: s.profiles.map((p) =>
          p.id === id ? { ...p, lastActive: Date.now() } : p
        ),
      }));
      supabase.from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('profiles lastActive:', error); });
    } else {
      set({ activeProfileId: null });
    }
  },

  setPasswordHash: (id, hash) => {
    set((s) => ({
      profiles: s.profiles.map((p) => p.id === id ? { ...p, passwordHash: hash } : p),
    }));
    supabase.from('profiles').update({ password_hash: hash }).eq('id', id)
      .then(({ error }) => { if (error) console.error('profiles setPasswordHash:', error); });
  },

  renameProfile: (id, name) => {
    set((s) => ({
      profiles: s.profiles.map((p) => p.id === id ? { ...p, name } : p),
    }));
    supabase.from('profiles').update({ name }).eq('id', id)
      .then(({ error }) => { if (error) console.error('profiles rename:', error); });
  },

  subscribe: () => {
    const channel = supabase
      .channel('profiles-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        get().fetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));

export function isAdmin(profile: Profile | undefined): boolean {
  if (!profile) return false;
  return profile.isAdmin === true || profile.name === 'Ross';
}
