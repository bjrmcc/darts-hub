import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { GameResult, Profile } from '../types';
import { logRT } from '../lib/realtimeLogger';

// Module-level refs prevent duplicate channels if subscribe() is called more than once
let resultsChannel: RealtimeChannel | null = null;
let resultsFetchDebounce: ReturnType<typeof setTimeout> | null = null;

interface StatisticsState {
  history: GameResult[];
  loaded: boolean;
  fetch: () => Promise<void>;
  addResult: (result: GameResult) => void;
  removeResult: (id: string) => void;
  clearHistory: () => void;
  resetProfileGameMode: (profileId: string, gameMode: string) => void;
  repairOrphanedRecords: (profiles: Profile[]) => Promise<number>;
  subscribe: () => () => void;
}

function rowToResult(row: Record<string, unknown>): GameResult {
  return {
    id: row.id as string,
    gameMode: row.game_mode as GameResult['gameMode'],
    players: row.players as string[],
    winnerId: (row.winner_id as string | null) ?? undefined,
    date: new Date(row.played_at as string).getTime(),
    stats: row.stats as GameResult['stats'],
    meta: (row.meta as Record<string, unknown>) ?? {},
  };
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  history: [],
  loaded: false,

  fetch: async () => {
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .order('played_at', { ascending: false });
    if (error) { console.error('game_results fetch:', error); return; }
    set({ history: (data ?? []).map(rowToResult), loaded: true });
  },

  addResult: (result) => {
    // Optimistic update
    set((s) => ({ history: [result, ...s.history] }));
    // Persist to Supabase
    supabase.from('game_results').insert({
      id: result.id,
      game_mode: result.gameMode,
      players: result.players,
      winner_id: result.winnerId ?? null,
      played_at: new Date(result.date).toISOString(),
      stats: result.stats,
      meta: result.meta ?? {},
    }).then(({ error }) => {
      if (error) console.error('game_results insert:', error);
    });
  },

  removeResult: (id) => {
    set((s) => ({ history: s.history.filter((r) => r.id !== id) }));
    supabase.from('game_results').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('game_results delete:', error); });
  },

  clearHistory: () => {
    set({ history: [] });
    supabase.from('game_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      .then(({ error }) => { if (error) console.error('game_results clear:', error); });
  },

  resetProfileGameMode: (profileId, gameMode) => {
    const toRemove = get().history
      .filter((r) => r.players.includes(profileId) && r.gameMode === gameMode)
      .map((r) => r.id);
    set((s) => ({
      history: s.history.filter(
        (r) => !(r.players.includes(profileId) && r.gameMode === gameMode)
      ),
    }));
    if (toRemove.length > 0) {
      supabase.from('game_results').delete().in('id', toRemove)
        .then(({ error }) => { if (error) console.error('game_results resetMode:', error); });
    }
  },

  repairOrphanedRecords: async (profiles) => {
    const profileIds = new Set(profiles.map((p) => p.id));
    const nameToId = new Map(profiles.map((p) => [p.name, p.id]));
    const orphaned = get().history.filter((r) => r.players.some((id) => !profileIds.has(id)));
    let fixed = 0;
    for (const result of orphaned) {
      const idMap: Record<string, string> = {};
      for (const ps of result.stats.players) {
        if (!profileIds.has(ps.playerId)) {
          const correctId = nameToId.get(ps.playerName);
          if (correctId) idMap[ps.playerId] = correctId;
        }
      }
      if (Object.keys(idMap).length === 0) continue;
      const fixedPlayers = result.players.map((id) => idMap[id] ?? id);
      const fixedWinnerId = result.winnerId ? (idMap[result.winnerId] ?? result.winnerId) : result.winnerId;
      let statsStr = JSON.stringify(result.stats);
      for (const [oldId, newId] of Object.entries(idMap)) {
        statsStr = statsStr.split(oldId).join(newId);
      }
      const fixedStats = JSON.parse(statsStr);
      await supabase.from('game_results').update({
        players: fixedPlayers,
        winner_id: fixedWinnerId ?? null,
        stats: fixedStats,
      }).eq('id', result.id);
      fixed++;
    }
    if (fixed > 0) await get().fetch();
    return fixed;
  },

  subscribe: () => {
    // Tear down any existing channel before creating a new one
    if (resultsChannel) {
      supabase.removeChannel(resultsChannel);
      resultsChannel = null;
    }
    resultsChannel = supabase
      .channel('results-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_results' }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const row = (payload.new ?? payload.old ?? {}) as Record<string, unknown>;
        const detail = `${payload.eventType} — mode: ${row.game_mode ?? '?'}`;
        logRT('game_results', payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', detail);
        // Debounce: coalesce rapid events (e.g. data repair updating several rows) into one fetch
        if (resultsFetchDebounce) clearTimeout(resultsFetchDebounce);
        resultsFetchDebounce = setTimeout(() => {
          get().fetch();
          resultsFetchDebounce = null;
        }, 300);
      })
      .subscribe();
    return () => {
      if (resultsFetchDebounce) { clearTimeout(resultsFetchDebounce); resultsFetchDebounce = null; }
      if (resultsChannel) { supabase.removeChannel(resultsChannel); resultsChannel = null; }
    };
  },
}));
