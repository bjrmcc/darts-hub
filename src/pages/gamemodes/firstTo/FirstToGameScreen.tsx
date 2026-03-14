import { useLocation } from 'react-router-dom';
import { useGameTurn } from '../../../hooks/useGameTurn';
import GameLayout from '../../../components/shared/GameLayout';
import type { DartHit } from '../../../components/dartboard/GameBoard';
import type { Profile } from '../../../types';

export default function FirstToGameScreen() {
  const { state } = useLocation();

  const players: Profile[] = state?.players ?? [];
  const playerNames = players.map((p) => p.name);

  const { currentPlayer, nextPlayer, dartIndex, lastTurn, throwDart, throwMiss } =
    useGameTurn(playerNames);

  function handleHit(hit: DartHit) {
    // Scoring logic to be implemented
    throwDart(hit);
  }

  return (
    <GameLayout
      currentPlayer={currentPlayer}
      dartIndex={dartIndex}
      nextPlayer={nextPlayer}
      lastTurn={lastTurn}
      onHit={handleHit}
      onMiss={throwMiss}
    />
  );
}
