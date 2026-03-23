import { useState } from 'react';

/**
 * Manages the info modal open state for a given game mode.
 * Auto-opens on first visit (keyed to localStorage) and can always
 * be re-opened via the ⓘ button.
 */
export function useInfoModal(key: string) {
  const storageKey = `darts-hub-info-${key}`;
  const [open, setOpen] = useState(() => !localStorage.getItem(storageKey));

  function close() {
    localStorage.setItem(storageKey, '1');
    setOpen(false);
  }

  function reopen() {
    setOpen(true);
  }

  return { open, close, reopen };
}
