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
        heading: 'Rules',
        bullets: [
          'Start at 501 or 301 and reduce your score to exactly zero.',
          'Double Out (on by default) — your final dart must land on a double.',
          'Double In (optional) — your first scoring dart must be a double.',
          'Bust — if a throw would take you below zero or leave you on 1, the entire visit is voided and your score reverts.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment on the dartboard after each dart is thrown.',
          'Outer ring = double · inner ring = treble · centre = bull.',
          'Tap Miss if the dart misses the board or bounces out.',
          'Use Undo ↩ to correct the previous dart.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Common finishes target double 20 (40), double 16 (32), or bull (50).',
          'Always leave yourself an even number so you have a double to aim at.',
        ],
      },
    ],
  },

  cricket: {
    title: 'Cricket',
    accent: 'green',
    sections: [
      {
        heading: 'Rules',
        bullets: [
          'Close numbers 15–20 and Bull by hitting each one 3 times.',
          'Singles count 1 hit, doubles count 2, trebles count 3.',
          'Once you close a number, further hits score points — but only against opponents who haven\'t closed it yet.',
          'First to close all numbers with equal or more points wins.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit on the dartboard after each dart.',
          'The scoreboard shows tally marks (|) for each number\'s progress towards being closed.',
          'Tap Miss for darts that miss or land on a non-Cricket number.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Prioritise closing numbers your opponent has already opened to cut off their scoring.',
          'Trebles close a number in a single dart — the most efficient play.',
        ],
      },
    ],
  },

  atc: {
    title: 'Around the Clock',
    accent: 'blue',
    sections: [
      {
        heading: 'Rules',
        bullets: [
          'Hit numbers 1 through 20 in order, then finish on Bull.',
          'Trebles/Doubles mode (optional) — only trebles or doubles count; singles are ignored.',
          'Bull Out (optional) — must hit the outer bull, then the inner bull to finish.',
          'First player to complete the full sequence wins.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit on the dartboard after each dart.',
          'Only hits on your current target advance you — all other hits are ignored.',
          'If all 3 darts in a visit hit the current target, you earn a bonus turn.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Focus only on the current target — hitting other numbers doesn\'t help.',
          'In Trebles mode, landing a treble advances you and immediately lets you attempt the next number.',
        ],
      },
    ],
  },

  firstTo: {
    title: 'First To',
    accent: 'amber',
    sections: [
      {
        heading: 'Rules',
        bullets: [
          'Choose a target number in setup. First player to reach the required hit count wins.',
          'Single = 1 mark · Double = 2 marks · Treble = 3 marks.',
          'Only hits on the chosen target number count towards your score.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Tap the segment you hit on the dartboard after each dart.',
          'Hits on other numbers are recorded for your stats but don\'t advance your score.',
          'Tap Miss for darts that miss the board entirely.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Pick a number you\'re accurate on — trebling it gives 3 marks in one dart.',
          'Adjust the target hit count (10–50) in setup to control game length.',
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
          'No win condition — just throw and build your stats.',
          'Select a target number, throw all 3 darts, then review your hit rate.',
          'Stats track hit rate, treble rate, and double rate per number.',
        ],
      },
      {
        heading: 'Inputting scores',
        bullets: [
          'Select a number from the panel on the right, then tap the board after each dart.',
          'Tap Change to switch to a different target number mid-session.',
          'Tap Miss for darts that miss the board. Use Undo ↩ to correct errors.',
        ],
      },
      {
        heading: 'Tips',
        bullets: [
          'Great for warming up or testing consistency on a specific number.',
          'Use the filter on the Free Throw stats screen to review your last 5 sessions.',
        ],
      },
    ],
  },
};
