/**
 * Dev-only realtime event logger.
 * All exports are no-ops when import.meta.env.DEV is false,
 * so nothing reaches production at runtime.
 */

export type RealtimeTable = 'profiles' | 'game_results' | 'game_sessions';
export type RealtimeEventType =
  | 'INSERT' | 'UPDATE' | 'DELETE'   // postgres_changes events
  | 'session_start' | 'session_push' | 'session_end' | 'session_watch'; // client actions

export interface RealtimeLogEntry {
  id: number;
  time: Date;
  table: RealtimeTable;
  type: RealtimeEventType;
  detail: string;
  source: 'remote' | 'local'; // remote = came from Supabase, local = this device sent it
}

const MAX_ENTRIES = 30;
let entries: RealtimeLogEntry[] = [];
let counter = 0;
const listeners = new Set<() => void>();

export function logRT(
  table: RealtimeTable,
  type: RealtimeEventType,
  detail: string,
  source: RealtimeLogEntry['source'] = 'remote',
): void {
  if (!import.meta.env.DEV) return;

  const entry: RealtimeLogEntry = { id: counter++, time: new Date(), table, type, detail, source };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);

  const icon = source === 'local' ? '▲' : '▼';
  console.log(`[RT] ${icon} ${table}/${type} — ${detail}`);

  listeners.forEach((fn) => fn());
}

export function getLogEntries(): RealtimeLogEntry[] {
  return entries;
}

export function clearLog(): void {
  entries = [];
  listeners.forEach((fn) => fn());
}

export function subscribeToLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
