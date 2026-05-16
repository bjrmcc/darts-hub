import { useState } from 'react';

export function useInfoModal(key: string, skip = false) {
  const storageKey = `darts-hub-info-dismissed-${key}`;
  const [open, setOpen] = useState(() => !skip && !localStorage.getItem(storageKey));
  const [manual, setManual] = useState(false);

  function close() {
    setOpen(false);
  }

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setOpen(false);
  }

  function reopen() {
    setManual(true);
    setOpen(true);
  }

  return { open, manual, close, dismiss, reopen };
}
