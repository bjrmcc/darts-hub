import { useState, useRef } from 'react';
import type { DartHit } from '../components/dartboard/GameBoard';

export interface DartEntry {
  playerName: string;
  dart: DartHit | 'miss';
  position: 0 | 1 | 2;
}

export interface TurnRecord {
  playerName: string;
  darts: (DartHit | 'miss')[];
  total: number;
}

export interface TurnSnapshot {
  currentPlayerIndex: number;
  dartIndex: number;
  currentDarts: (DartHit | 'miss')[];
  lastTurn: TurnRecord | null;
  bonusTurn: boolean;
  scoringCount: number;
  allDartsLength: number;
}

export function dartLabel(d: DartHit | 'miss'): string {
  return d === 'miss' ? 'Miss' : d.label;
}

export function useGameTurn(
  playerNames: string[],
  options?: { bonusTurnOnAllHits?: boolean }
) {
  const bonusTurnEnabled = options?.bonusTurnOnAllHits ?? false;
  // Tracks how many darts this turn were scoring hits (not incremented for Cricket/X01)
  const scoringCountRef = useRef(0);

  const allDartsRef = useRef<DartEntry[]>([]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dartIndex, setDartIndex] = useState(0);
  const [currentDarts, setCurrentDarts] = useState<(DartHit | 'miss')[]>([]);
  const [lastTurn, setLastTurn] = useState<TurnRecord | null>(null);
  const [bonusTurn, setBonusTurn] = useState(false);

  const currentPlayer = playerNames[currentPlayerIndex] ?? '';
  const nextPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
  const nextPlayer = playerNames.length > 1 ? playerNames[nextPlayerIndex] : null;

  function advance(newDarts: (DartHit | 'miss')[]) {
    if (bonusTurn && newDarts.length === 1) {
      setBonusTurn(false);
    }

    if (newDarts.length === 3) {
      const total = newDarts.reduce(
        (sum, d) => sum + (d === 'miss' ? 0 : d.score),
        0
      );
      setLastTurn({ playerName: currentPlayer, darts: newDarts, total });
      setDartIndex(0);
      setCurrentDarts([]);

      const allScored = bonusTurnEnabled && scoringCountRef.current === 3;
      scoringCountRef.current = 0;

      if (allScored) {
        setBonusTurn(true);
      } else {
        setBonusTurn(false);
        setCurrentPlayerIndex(nextPlayerIndex);
      }
    } else {
      setDartIndex(newDarts.length);
      setCurrentDarts(newDarts);
    }
  }

  function throwDart(hit: DartHit, didScore = false) {
    allDartsRef.current.push({ playerName: currentPlayer, dart: hit, position: dartIndex as 0 | 1 | 2 });
    if (bonusTurnEnabled && didScore) {
      scoringCountRef.current += 1;
    }
    advance([...currentDarts, hit]);
  }

  function throwMiss() {
    allDartsRef.current.push({ playerName: currentPlayer, dart: 'miss', position: dartIndex as 0 | 1 | 2 });
    advance([...currentDarts, 'miss']);
  }

  function snapshot(): TurnSnapshot {
    return {
      currentPlayerIndex,
      dartIndex,
      currentDarts: [...currentDarts],
      lastTurn,
      bonusTurn,
      scoringCount: scoringCountRef.current,
      allDartsLength: allDartsRef.current.length,
    };
  }

  function restore(s: TurnSnapshot) {
    setCurrentPlayerIndex(s.currentPlayerIndex);
    setDartIndex(s.dartIndex);
    setCurrentDarts(s.currentDarts);
    setLastTurn(s.lastTurn);
    setBonusTurn(s.bonusTurn);
    scoringCountRef.current = s.scoringCount;
    allDartsRef.current = allDartsRef.current.slice(0, s.allDartsLength ?? 0);
  }

  function getAllDarts(): DartEntry[] {
    return [...allDartsRef.current];
  }

  return {
    currentPlayerIndex,
    currentPlayer,
    nextPlayer,
    dartIndex,
    currentDarts,
    lastTurn,
    bonusTurn,
    throwDart,
    throwMiss,
    snapshot,
    restore,
    getAllDarts,
  };
}
