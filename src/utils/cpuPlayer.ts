import type { DartHit } from '../components/dartboard/GameBoard';

// ── Types ──────────────────────────────────────────────────────

export interface CpuProfile {
  /** 0–1: probability the dart stays on the aimed number (vs drifting to a neighbour) */
  grouping: number;
  /** 0–1: probability of hitting treble when aiming for treble */
  trebleRate: number;
  /** 0–1: probability of hitting double when aiming for double */
  doubleRate: number;
  /** 0–1: probability dart completely misses the scoring area */
  missRate: number;
  /** ms delay between each CPU dart throw */
  dartDelayMs: number;
}

export interface AimTarget {
  number: number;
  wantMultiplier: 1 | 2 | 3;
}

// ── Board adjacency ────────────────────────────────────────────

const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const ADJACENCY: Record<number, [number, number]> = {};
BOARD_ORDER.forEach((n, i) => {
  ADJACENCY[n] = [
    BOARD_ORDER[(i - 1 + 20) % 20],
    BOARD_ORDER[(i + 1) % 20],
  ];
});

// ── Difficulty → profile ───────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function cpuProfileFromDifficulty(difficulty: number): CpuProfile {
  const t = (Math.max(1, Math.min(30, difficulty)) - 1) / 29;
  return {
    grouping: lerp(0.30, 0.88, t),
    trebleRate: lerp(0.04, 0.55, t),
    doubleRate: lerp(0.08, 0.65, t),
    missRate: lerp(0.18, 0.02, t),
    dartDelayMs: Math.round(lerp(1300, 650, t)),
  };
}

// ── Core simulation ────────────────────────────────────────────

function makeDartHit(number: number, multiplier: 1 | 2 | 3): DartHit {
  const score = number === 25 ? (multiplier === 2 ? 50 : 25) : number * multiplier;
  const label =
    number === 25
      ? multiplier === 2 ? 'D-Bull' : 'Bull'
      : `${multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : ''}${number}`;
  return { number, multiplier, score, label };
}

export function simulateDart(aim: AimTarget, profile: CpuProfile): DartHit | 'miss' {
  if (Math.random() < profile.missRate) return 'miss';

  // Determine which number the dart lands on
  let actualNumber = aim.number;
  if (aim.number !== 25 && Math.random() > profile.grouping) {
    const neighbours = ADJACENCY[aim.number] ?? [aim.number, aim.number];
    actualNumber = neighbours[Math.floor(Math.random() * 2)];
  }

  // Determine multiplier
  let multiplier: 1 | 2 | 3 = 1;
  if (actualNumber === aim.number) {
    if (aim.wantMultiplier === 3) {
      if (Math.random() < profile.trebleRate) multiplier = 3;
      else if (Math.random() < 0.18) multiplier = 2;
      else multiplier = 1;
    } else if (aim.wantMultiplier === 2) {
      if (Math.random() < profile.doubleRate) multiplier = 2;
      else multiplier = 1;
    } else {
      multiplier = Math.random() < 0.05 ? 2 : 1;
    }
  } else {
    // Drifted to adjacent: almost always single
    multiplier = Math.random() < 0.07 ? 2 : 1;
  }

  // Bull can't have multiplier 3
  if (actualNumber === 25 && multiplier === 3) multiplier = 1;

  return makeDartHit(actualNumber, multiplier);
}

// ── Aim functions ──────────────────────────────────────────────

export function aimX01(score: number, doubleOut: boolean): AimTarget {
  if (doubleOut) {
    if (score === 50) return { number: 25, wantMultiplier: 2 };
    if (score <= 40 && score % 2 === 0 && score > 0) {
      // Checkout: aim for the double
      const n = score / 2;
      return { number: n <= 20 ? n : 20, wantMultiplier: 2 };
    }
    if (score <= 40 && score % 2 === 1) {
      // Odd: aim single 1 to leave an even checkout
      return { number: 1, wantMultiplier: 1 };
    }
  }
  // Scoring phase: always aim T20
  return { number: 20, wantMultiplier: 3 };
}

const CRICKET_NUMS = [20, 19, 18, 17, 16, 15, 25] as const;
type CricketNum = (typeof CRICKET_NUMS)[number];

export function aimCricket(
  marks: Record<CricketNum, { team1: number; team2: number }>,
  team: 'team1' | 'team2',
): AimTarget {
  const opp = team === 'team1' ? 'team2' : 'team1';

  // Priority 1: close a number the opponent has open (stop their scoring)
  for (const n of CRICKET_NUMS) {
    if (marks[n][opp] >= 3 && marks[n][team] < 3) {
      const needed = 3 - marks[n][team];
      return { number: n, wantMultiplier: needed >= 3 ? 3 : needed >= 2 ? 2 : 1 };
    }
  }

  // Priority 2: open / close the highest unclosed number
  for (const n of CRICKET_NUMS) {
    if (marks[n][team] < 3) {
      const needed = 3 - marks[n][team];
      return { number: n, wantMultiplier: needed >= 3 ? 3 : needed >= 2 ? 2 : 1 };
    }
  }

  return { number: 20, wantMultiplier: 3 };
}

export function aimATC(
  targetNumber: number,
  requiredMult: number | null,
  trebleDoubles: boolean,
): AimTarget {
  if (targetNumber === 25) {
    return { number: 25, wantMultiplier: requiredMult === 2 ? 2 : 1 };
  }
  return { number: targetNumber, wantMultiplier: trebleDoubles ? 3 : 1 };
}

export function aimFirstTo(targetNumber: number): AimTarget {
  return { number: targetNumber, wantMultiplier: 3 };
}
