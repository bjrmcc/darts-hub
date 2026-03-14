const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 120;
const INNER_R = 22;
const LABEL_R = 137;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(r: number, angleDeg: number) {
  return {
    x: CX + r * Math.cos(toRad(angleDeg)),
    y: CY + r * Math.sin(toRad(angleDeg)),
  };
}

function segmentPath(innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const s1 = polarToXY(outerR, startAngle);
  const s2 = polarToXY(outerR, endAngle);
  const s3 = polarToXY(innerR, endAngle);
  const s4 = polarToXY(innerR, startAngle);
  return [
    `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 0 1 ${s2.x.toFixed(2)} ${s2.y.toFixed(2)}`,
    `L ${s3.x.toFixed(2)} ${s3.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 0 0 ${s4.x.toFixed(2)} ${s4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface Props {
  selected: number | null;
  onSelect: (n: number) => void;
}

export default function MiniDartboard({ selected, onSelect }: Props) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ maxWidth: '100%', touchAction: 'manipulation' }}
    >
      {NUMBERS.map((num, i) => {
        const centerAngle = -90 + i * 18;
        const startAngle = centerAngle - 9;
        const endAngle = centerAngle + 9;
        const isSelected = selected === num;
        const isEven = i % 2 === 0;

        const labelPos = polarToXY(LABEL_R, centerAngle);

        return (
          <g key={num} onClick={() => onSelect(num)} style={{ cursor: 'pointer' }}>
            <path
              d={segmentPath(INNER_R, OUTER_R, startAngle, endAngle)}
              fill={isSelected ? '#e8261a' : isEven ? '#222' : '#333'}
              stroke="#111"
              strokeWidth={1}
            />
            <text
              x={labelPos.x.toFixed(2)}
              y={labelPos.y.toFixed(2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isSelected ? '#fff' : '#aaa'}
              fontSize={11}
              fontWeight={isSelected ? 700 : 400}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {num}
            </text>
          </g>
        );
      })}

      {/* Bullseye */}
      <circle
        cx={CX}
        cy={CY}
        r={INNER_R}
        fill={selected === 25 ? '#e8261a' : '#444'}
        stroke="#111"
        strokeWidth={1}
        onClick={() => onSelect(25)}
        style={{ cursor: 'pointer' }}
      />
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={selected === 25 ? '#fff' : '#aaa'}
        fontSize={10}
        fontWeight={selected === 25 ? 700 : 400}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        Bull
      </text>
    </svg>
  );
}
