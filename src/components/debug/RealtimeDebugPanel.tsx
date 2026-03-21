import { useState, useEffect } from 'react';
import { getLogEntries, clearLog, subscribeToLog, type RealtimeLogEntry } from '../../lib/realtimeLogger';

const TABLE_COLOR: Record<RealtimeLogEntry['table'], string> = {
  profiles:      '#4a90d9',
  game_results:  '#4caf50',
  game_sessions: '#ff9800',
};

const TYPE_COLOR: Record<RealtimeLogEntry['type'], string> = {
  INSERT:        '#4caf50',
  UPDATE:        '#f0c040',
  DELETE:        '#e05555',
  session_start: '#4a90d9',
  session_push:  '#aaa',
  session_end:   '#e05555',
  session_watch: '#777',
};

function fmt(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

export default function RealtimeDebugPanel() {
  // Mounted only in dev (App.tsx gates this with import.meta.env.DEV)
  const [entries, setEntries] = useState(getLogEntries);
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeToLog(() => setEntries(getLogEntries())), []);

  return (
    <div className="rtdbg-root">
      {open ? (
        <div className="rtdbg-panel">
          <div className="rtdbg-header">
            <span className="rtdbg-title">Realtime log</span>
            <span className="rtdbg-count">{entries.length}</span>
            <button className="rtdbg-clear" onClick={clearLog}>Clear</button>
            <button className="rtdbg-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="rtdbg-list">
            {entries.length === 0 && (
              <p className="rtdbg-empty">No events yet.</p>
            )}
            {entries.map((e) => (
              <div key={e.id} className={`rtdbg-row${e.source === 'local' ? ' rtdbg-row--local' : ''}`}>
                <span className="rtdbg-time">{fmt(e.time)}</span>
                <span className="rtdbg-arrow">{e.source === 'local' ? '▲' : '▼'}</span>
                <span className="rtdbg-table" style={{ color: TABLE_COLOR[e.table] }}>
                  {e.table.replace('game_', '')}
                </span>
                <span className="rtdbg-type" style={{ color: TYPE_COLOR[e.type] }}>
                  {e.type}
                </span>
                <span className="rtdbg-detail">{e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button className="rtdbg-toggle" onClick={() => setOpen(true)} title="Realtime debug log">
          RT{entries.length > 0 && <span className="rtdbg-badge">{Math.min(entries.length, 99)}</span>}
        </button>
      )}
    </div>
  );
}
