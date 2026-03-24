import { useEffect, useRef } from 'react';

/**
 * Schedules one CPU dart throw per (isActive, dartIndex) change.
 * `onThrow` is read via ref so it always has a fresh closure — no need to
 * wrap the caller's callback in useCallback.
 */
export function useCpuTurn(
  isActive: boolean,
  dartIndex: number,
  onThrow: () => void,
  delayMs: number,
) {
  const onThrowRef = useRef(onThrow);
  useEffect(() => { onThrowRef.current = onThrow; });

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => onThrowRef.current(), delayMs);
    return () => clearTimeout(t);
  }, [isActive, dartIndex, delayMs]);
}
