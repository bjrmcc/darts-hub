import { useState, useRef } from 'react';

interface Props {
  children: [React.ReactNode, React.ReactNode];
  accentClass?: string;
  onPageChange?: (page: number) => void;
  initialPage?: number;
}

export default function SlidingPages({ children, accentClass, onPageChange, initialPage = 0 }: Props) {
  const [page, setPage] = useState(initialPage);
  const startX = useRef<number | null>(null);

  function goTo(p: number) {
    setPage(p);
    onPageChange?.(p);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx < -20 && page === 0) goTo(1);
    if (dx > 20  && page === 1) goTo(0);
    startX.current = null;
  }

  const ac = accentClass ?? '';

  return (
    <div
      className="sliding-pages"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div
        className="sliding-pages-track"
        style={{ transform: `translateX(-${page * 100}%)` }}
      >
        <div className="sliding-pages-panel">{children[0]}</div>
        <div className="sliding-pages-panel">{children[1]}</div>
      </div>

      {/* ← Stats tab — always present on leaderboard side */}
      {page === 1 && (
        <button
          className={`sliding-tab sliding-tab--left ${ac}`}
          onClick={() => goTo(0)}
          aria-label="View stats"
        >
          <span className="sliding-tab-arrow">‹</span>
          <span className="sliding-tab-label">Stats</span>
        </button>
      )}

      {/* Leaderboard → tab — always present on stats side */}
      {page === 0 && (
        <button
          className={`sliding-tab sliding-tab--right ${ac}`}
          onClick={() => goTo(1)}
          aria-label="View leaderboard"
        >
          <span className="sliding-tab-label">Leaderboard</span>
          <span className="sliding-tab-arrow">›</span>
        </button>
      )}
    </div>
  );
}
