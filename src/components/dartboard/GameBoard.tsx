import { useState } from 'react';

export interface DartHit {
  score: number;
  label: string;
  number: number;
  multiplier: 1 | 2 | 3;
}

const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const CX = 190;
const CY = 190;
const OUTER_R    = 155; // double outer edge
const DOUBLE_IN  = 139; // double inner edge
const TRIPLE_OUT = 99;  // triple outer edge
const TRIPLE_IN  = 83;  // triple inner edge
const BULL_R     = 17;  // bull (25)
const BULLSEYE_R = 8;   // bullseye / double bull (50)
const LABEL_R    = 171; // number labels

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polarXY(r: number, deg: number) {
  return {
    x: CX + r * Math.cos(toRad(deg)),
    y: CY + r * Math.sin(toRad(deg)),
  };
}

function arcPath(r1: number, r2: number, a1: number, a2: number) {
  const p1 = polarXY(r2, a1);
  const p2 = polarXY(r2, a2);
  const p3 = polarXY(r1, a2);
  const p4 = polarXY(r1, a1);
  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${r2} ${r2} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${r1} ${r1} 0 0 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

interface Props {
  onHit: (hit: DartHit) => void;
}

export default function GameBoard({ onHit }: Props) {
  const [flashKey, setFlashKey] = useState<string | null>(null);

  function hit(key: string, dartHit: DartHit) {
    setFlashKey(key);
    setTimeout(() => setFlashKey(null), 350);
    onHit(dartHit);
  }

  return (
    <svg
      viewBox="0 0 380 380"
      style={{ width: '100%', height: '100%', touchAction: 'manipulation', display: 'block' }}
    >
      {/* Outer board background */}
      <circle cx={CX} cy={CY} r={188} fill="#1a1a1a" />
      <circle cx={CX} cy={CY} r={OUTER_R + 1} fill="#111" />

      {NUMBERS.map((num, i) => {
        const centerAngle = -90 + i * 18;
        const start = centerAngle - 9;
        const end   = centerAngle + 9;
        const even  = i % 2 === 0;

        const zones = [
          {
            key: `D${num}`,
            r1: DOUBLE_IN, r2: OUTER_R,
            baseFill: even ? '#aa0000' : '#006400',
            score: num * 2, multiplier: 2 as const, label: `D${num}`,
          },
          {
            key: `So${num}`,
            r1: TRIPLE_OUT, r2: DOUBLE_IN,
            baseFill: even ? '#e8d5a3' : '#222',
            score: num, multiplier: 1 as const, label: `${num}`,
          },
          {
            key: `T${num}`,
            r1: TRIPLE_IN, r2: TRIPLE_OUT,
            baseFill: even ? '#aa0000' : '#006400',
            score: num * 3, multiplier: 3 as const, label: `T${num}`,
          },
          {
            key: `Si${num}`,
            r1: BULL_R, r2: TRIPLE_IN,
            baseFill: even ? '#e8d5a3' : '#222',
            score: num, multiplier: 1 as const, label: `${num}`,
          },
        ];

        const lp = polarXY(LABEL_R, centerAngle);

        return (
          <g key={num}>
            {zones.map((z) => (
              <path
                key={z.key}
                d={arcPath(z.r1, z.r2, start, end)}
                fill={flashKey === z.key ? '#ff6b35' : z.baseFill}
                stroke="#000"
                strokeWidth={0.8}
                onClick={() => hit(z.key, { score: z.score, label: z.label, number: num, multiplier: z.multiplier })}
                style={{ cursor: 'pointer' }}
              />
            ))}
            <text
              x={lp.x.toFixed(1)}
              y={lp.y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize={12}
              fontWeight={700}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {num}
            </text>
          </g>
        );
      })}

      {/* Bull (25) */}
      <circle
        cx={CX} cy={CY} r={BULL_R}
        fill={flashKey === 'Bull' ? '#ff6b35' : '#006400'}
        stroke="#000" strokeWidth={0.8}
        onClick={() => hit('Bull', { score: 25, label: 'Bull', number: 25, multiplier: 1 })}
        style={{ cursor: 'pointer' }}
      />
      {/* Bullseye / Double Bull (50) */}
      <circle
        cx={CX} cy={CY} r={BULLSEYE_R}
        fill={flashKey === 'DBull' ? '#ff6b35' : '#aa0000'}
        stroke="#000" strokeWidth={0.8}
        onClick={() => hit('DBull', { score: 50, label: 'D-Bull', number: 25, multiplier: 2 })}
        style={{ cursor: 'pointer' }}
      />
    </svg>
  );
}
