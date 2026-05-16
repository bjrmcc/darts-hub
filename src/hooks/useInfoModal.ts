import { useState } from 'react';

export function useInfoModal(key: string, skip = false) {
  const storageKey = `darts-hub-info-dismissed-${key}`;
  const [open, setOpen] = useState(() => !skip && !localStorage.getItem(storageKey));

  function close() {
    setOpen(false);
  }

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setOpen(false);
  }

  function reopen() {
    setOpen(true);
  }

  return { open, close, dismiss, reopen };
}
