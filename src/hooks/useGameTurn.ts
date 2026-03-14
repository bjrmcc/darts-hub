import { useState } from 'react';
import type { DartHit } from '../components/dartboard/GameBoard';

export interface TurnRecord {
  playerName: string;
  darts: (DartHit | 'miss')[];
  total: number;
}

export function dartLabel(d: DartHit | 'miss'): string {
  return d === 'miss' ? 'Miss' : d.label;
}

export function useGameTurn(playerNames: string[]) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dartIndex, setDartIndex] = useState(0);
  const [currentDarts, setCurrentDarts] = useState<(DartHit | 'miss')[]>([]);
  const [lastTurn, setLastTurn] = useState<TurnRecord | null>(null);

  const currentPlayer = playerNames[currentPlayerIndex] ?? '';
  const nextPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
  const nextPlayer = playerNames.length > 1 ? playerNames[nextPlayerIndex] : null;

  function advance(newDarts: (DartHit | 'miss')[]) {
    if (newDarts.length === 3) {
      const total = newDarts.reduce(
        (sum, d) => sum + (d === 'miss' ? 0 : d.score),
        0
      );
      setLastTurn({ playerName: currentPlayer, darts: newDarts, total });
      setCurrentPlayerIndex(nextPlayerIndex);
      setDartIndex(0);
      setCurrentDarts([]);
    } else {
      setDartIndex(newDarts.length);
      setCurrentDarts(newDarts);
    }
  }

  function throwDart(hit: DartHit) {
    advance([...currentDarts, hit]);
  }

  function throwMiss() {
    advance([...currentDarts, 'miss']);
  }

  return {
    currentPlayerIndex,
    currentPlayer,
    nextPlayer,
    dartIndex,
    currentDarts,
    lastTurn,
    throwDart,
    throwMiss,
  };
}
