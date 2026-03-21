import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface LiveSession {
  id: string;
  gameMode: string;
  playerIds: string[];
  state: Record<string, unknown>;
  updatedAt: string;
}

interface GameSessionState {
  sessionId: string | null;
  startSession: (gameMode: string, playerIds: string[], state: Record<string, unknown>) => Promise<string>;
  pushState: (state: Record<string, unknown>) => void;
  endSession: () => void;
  subscribeToSession: (id: string, onUpdate: (state: Record<string, unknown>) => void) => () => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  sessionId: null,

  startSession: async (gameMode, playerIds, state) => {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('game_sessions').insert({
      id,
      game_mode: gameMode,
      player_ids: playerIds,
      state,
    });
    if (error) console.error('session start:', error);
    set({ sessionId: id });
    return id;
  },

  pushState: (state) => {
    const { sessionId } = get();
    if (!sessionId) return;
    supabase.from('game_sessions')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .then(({ error }) => { if (error) console.error('session push:', error); });
  },

  endSession: () => {
    const { sessionId } = get();
    if (!sessionId) return;
    supabase.from('game_sessions').delete().eq('id', sessionId)
      .then(({ error }) => { if (error) console.error('session end:', error); });
    set({ sessionId: null });
  },

  subscribeToSession: (id, onUpdate) => {
    const channel = supabase
      .channel(`session-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onUpdate(row.state as Record<string, unknown>);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
