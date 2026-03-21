import type { DartEntry } from '../hooks/useGameTurn';
import type { Profile, GameStats } from '../types';

export function buildGameStats(
  players: Profile[],
  allDarts: DartEntry[],
  winnerIds: string[]
): GameStats {
  return {
    players: players.map((p) => {
      const pDarts = allDarts.filter((d) => d.playerName === p.name);
      const d1 = pDarts.filter((d) => d.position === 0);
      const d2 = pDarts.filter((d) => d.position === 1);
      const d3 = pDarts.filter((d) => d.position === 2);
      return {
        playerId: p.id,
        playerName: p.name,
        d1: d1.map((d) => (d.dart === 'miss' ? 0 : d.dart.score)),
        d2: d2.map((d) => (d.dart === 'miss' ? 0 : d.dart.score)),
        d3: d3.map((d) => (d.dart === 'miss' ? 0 : d.dart.score)),
        d1m: d1.map((d) => (d.dart === 'miss' ? 0 : d.dart.multiplier)),
        d2m: d2.map((d) => (d.dart === 'miss' ? 0 : d.dart.multiplier)),
        d3m: d3.map((d) => (d.dart === 'miss' ? 0 : d.dart.multiplier)),
        won: winnerIds.includes(p.id),
      };
    }),
  };
}
