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
  sessionToken: string | null;
  version: number;
  startSession: (gameMode: string, playerIds: string[], state: Record<string, unknown>) => Promise<string>;
  pushState: (state: Record<string, unknown>) => void;
  endSession: () => void;
  subscribeToSession: (id: string, onUpdate: (state: Record<string, unknown>) => void) => () => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  sessionId: null,
  sessionToken: null,
  version: 0,

  startSession: async (gameMode, playerIds, state) => {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({ id, game_mode: gameMode, player_ids: playerIds, state })
      .select('session_token')
      .single();
    if (error) console.error('session start:', error);
    set({ sessionId: id, sessionToken: (data?.session_token as string) ?? null, version: 0 });
    return id;
  },

  pushState: (state) => {
    const { sessionId, sessionToken, version } = get();
    if (!sessionId || !sessionToken) return;
    supabase
      .rpc('push_game_session_state', {
        p_id:      sessionId,
        p_token:   sessionToken,
        p_state:   state,
        p_version: version,
      })
      .then(({ data, error }) => {
        if (error) { console.error('session push:', error); return; }
        if (data === true) set((s) => ({ version: s.version + 1 }));
        // data === false → version conflict (another client wrote first); safe to ignore
      });
  },

  endSession: () => {
    const { sessionId } = get();
    if (!sessionId) return;
    supabase.from('game_sessions').delete().eq('id', sessionId)
      .then(({ error }) => { if (error) console.error('session end:', error); });
    set({ sessionId: null, sessionToken: null, version: 0 });
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
