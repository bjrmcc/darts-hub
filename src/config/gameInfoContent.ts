export interface InfoSection {
  heading: string;
  bullets: string[];
}

export interface GameInfoContent {
  title: string;
  accent: string; // matches existing mode accent colours
  sections: InfoSection[];
}

export const GAME_INFO: Record<string, GameInfoContent> = {
  x01: {
    title: 'X01',
    accent: 'red',
    sections: [
      {
        heading: 'Objective',
        bullets: [
          'Start at 501 (or 301) and reduce your score to exactly zero.',
          'With Double Out on (default), your final dart must land on a double or the bullseye.',
          'With Double In on, your first scoring dart must also be a double.',
        ],
      },
      {
        heading: 'Busting',
        bullets: [
          'If a throw would take you below zero, leave you on exactly 1, or finish on a non-double when Double Out is on — it\'s a bust.',
          'The entire visit is voided and your score reverts to what it was at the start of that turn.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit after each dart.',
          'Outer ring = double · inner ring = treble · small centre = outer bull (25) · bullseye = 50.',
          'Tap Miss if the dart misses or bounces out. Use Undo ↩ to correct the last dart.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Always aim to leave an even number — that way you always have a double to aim at.',
          'Common finishes: 40 → D20, 32 → D16, 36 → D18, 50 → Bull.',
          'If you need an odd score, hit a single first to make it even before going for the double.',
        ],
      },
    ],
  },

  cricket: {
    title: 'Cricket',
    accent: 'green',
    sections: [
      {
        heading: 'Objective',
        bullets: [
          'Numbers 15–20 and Bull are in play. Be the first to open all seven while keeping your score equal to or higher than your opponent\'s.',
        ],
      },
      {
        heading: 'Opening & closing numbers',
        bullets: [
          'Opening — hit a number 3 times on your side. Singles count 1, doubles 2, trebles 3.',
          'Once you\'ve opened a number, every further hit on it scores points — but only while your opponent hasn\'t opened it yet.',
          'Closing — when both players have opened a number (3 marks each), it\'s closed and no one can score on it anymore.',
        ],
      },
      {
        heading: 'Winning',
        bullets: [
          'Open all 7 numbers while having equal or more points than your opponent.',
          'If you open everything first but are behind on points, keep scoring until you catch up.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit after each dart.',
          'The scoreboard shows tally marks for each number: / = 1, X = 2, ⊗ = open (3+).',
          'Tap Miss for darts on numbers outside 15–20 and Bull.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Trebles open a number in a single dart — the most efficient move in the game.',
          'If your opponent opens a number before you, open it quickly to stop their scoring.',
          'Once you\'re ahead on points, focus on opening remaining numbers rather than scoring.',
        ],
      },
    ],
  },

  atc: {
    title: 'Around the Clock',
    accent: 'blue',
    sections: [
      {
        heading: 'Objective',
        bullets: [
          'Hit numbers 1 through 20 in order, then finish on Bull.',
          'With Bull Out on, you must hit the outer bull (25) before the bullseye (50).',
          'First player to complete the full sequence wins.',
        ],
      },
      {
        heading: 'Trebles & Doubles',
        bullets: [
          'With this option on, multipliers advance you further through the sequence.',
          'Single → move forward 1 · Double → skip one number ahead · Treble → skip two numbers.',
          'With it off, only singles count — every hit advances you exactly one step regardless of multiplier.',
        ],
      },
      {
        heading: 'Bonus turn',
        bullets: [
          'If all 3 darts in a visit land on your current target, you earn an extra visit immediately.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit after each dart.',
          'Only hits on your current target advance you — everything else is ignored.',
          'Tap Miss for darts that miss the board. Use Undo ↩ to correct the last dart.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Focus entirely on the current target — hitting other numbers does nothing.',
          'With Trebles & Doubles on, landing a treble skips two numbers ahead, so aim for the thin inner ring.',
        ],
      },
    ],
  },

  firstTo: {
    title: 'First To',
    accent: 'amber',
    sections: [
      {
        heading: 'Objective',
        bullets: [
          'Choose a target number in setup. The first player to hit it the required number of times wins.',
          'Single = 1 hit · Double = 2 hits · Treble = 3 hits.',
          'Hits on any other number are ignored.',
        ],
      },
      {
        heading: 'Setup options',
        bullets: [
          'Target number — pick any number on the board using the mini dartboard.',
          'Hits to win — set between 10 and 50 (step 5) to control how long the game runs.',
          'Legs — play a best-of-1, 3, or 5 series.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit after each dart.',
          'Hits on the target number are counted automatically — doubles and trebles count as 2 and 3.',
          'Tap Miss for darts that miss. Use Undo ↩ to correct the last dart.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Pick a number you\'re already accurate at — consistency beats chasing trebles.',
          'Trebling the target scores 3 hits in one dart, so the thin inner ring is your best friend.',
          'Increase the hit count for a longer, more tactical match.',
        ],
      },
    ],
  },

  freeThrow: {
    title: 'Free Throw',
    accent: 'purple',
    sections: [
      {
        heading: 'How it works',
        bullets: [
          'No win condition, no pressure — just throw and track your accuracy.',
          'Select a target number, throw your darts, and your hit rate is recorded automatically.',
          'Stats break down by single, double, and treble hit rate per number over time.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Select a target number from the panel, then tap the segment you hit after each dart.',
          'Tap Miss for darts that miss or land on the wrong number.',
          'Use Undo ↩ to correct the last dart. You can switch target numbers mid-session.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Use it to warm up before a match or drill a specific checkout number.',
          'Check your Free Throw stats to see which numbers you\'re most and least accurate on.',
        ],
      },
    ],
  },
};
