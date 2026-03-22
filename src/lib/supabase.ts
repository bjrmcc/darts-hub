import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  realtime: {
    // Send heartbeats every 15 s (default 30 s) so stale sockets are
    // detected and reconnected twice as fast on poor mobile connections.
    heartbeatIntervalMs: 15_000,
  },
});
