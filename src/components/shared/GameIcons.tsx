interface IconProps { className?: string; }

export function DartIcon({ className = 'home-tile-icon' }: IconProps) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <g transform="translate(30,30) rotate(-40) translate(-30,-30)">
        <polygon points="60,29.5 60,30.5 66,30" fill="#e0e0e0" />
        <rect x="40" y="27.5" width="20" height="5" rx="2.5" fill="#aaa" />
        <rect x="24" y="29" width="16" height="2" rx="1" fill="#555" />
        <polygon points="6,20 24,29 24,31 6,40" fill="#c0392b" />
        <line x1="6" y1="20" x2="6" y2="40" stroke="#8B1a0e" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function CricketIcon({ className = 'home-tile-icon' }: IconProps) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <line x1="40" y1="16" x2="40" y2="50" stroke="#ccc" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="45" y1="16" x2="45" y2="50" stroke="#ccc" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="50" y1="16" x2="50" y2="50" stroke="#ccc" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="38" y1="16.5" x2="46" y2="15" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43" y1="15" x2="52" y2="16.5" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" />
      <g transform="translate(19,34) rotate(38)">
        <rect x="-2.5" y="-22" width="5" height="14" rx="2.5" fill="#8B6310" />
        <line x1="-2.5" y1="-19" x2="2.5" y2="-19" stroke="#5a3e0a" strokeWidth="0.9" />
        <line x1="-2.5" y1="-15" x2="2.5" y2="-15" stroke="#5a3e0a" strokeWidth="0.9" />
        <line x1="-2.5" y1="-11" x2="2.5" y2="-11" stroke="#5a3e0a" strokeWidth="0.9" />
        <path d="M-5,-8 Q-7,4 -5,18 L0,20 L5,18 Q7,4 5,-8 Z" fill="#D4B472" />
        <line x1="0" y1="-8" x2="0" y2="19" stroke="#b8933e" strokeWidth="1.2" />
      </g>
      <circle cx="13" cy="16" r="7.5" fill="#c0392b" />
      <path d="M8,12 Q13,10 18,12" fill="none" stroke="#7a1a0a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8,20 Q13,22 18,20" fill="none" stroke="#7a1a0a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className = 'home-tile-icon' }: IconProps) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    return {
      x1: 30 + 22 * Math.cos(angle), y1: 30 + 22 * Math.sin(angle),
      x2: 30 + (isMajor ? 18 : 20) * Math.cos(angle),
      y2: 30 + (isMajor ? 18 : 20) * Math.sin(angle),
      major: isMajor,
    };
  });
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <circle cx="30" cy="30" r="24" fill="#181818" stroke="#444" strokeWidth="2" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? '#888' : '#3a3a3a'} strokeWidth={t.major ? 2 : 1.2} strokeLinecap="round" />
      ))}
      <line x1="30" y1="30" x2="20" y2="17" stroke="#e0e0e0" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="30" x2="41" y2="18" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="33" x2="30" y2="46" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="30" x2="30" y2="19" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="30" cy="30" r="2.5" fill="#e0e0e0" />
    </svg>
  );
}

export function FlagIcon({ className = 'home-tile-icon' }: IconProps) {
  const squares = [];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      squares.push(
        <rect key={`${col}-${row}`} x={14 + col * 9} y={8 + row * 9} width={9} height={9}
          fill={(col + row) % 2 === 0 ? '#e0e0e0' : '#222'} />
      );
    }
  }
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <rect x="13" y="7" width="36" height="27" rx="1" fill="none" stroke="#555" strokeWidth="0.5" />
      {squares}
      <line x1="13" y1="7" x2="13" y2="54" stroke="#777" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="7" y1="50" x2="53" y2="50" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,3" />
    </svg>
  );
}

export function BullseyeIcon({ className = 'home-tile-icon' }: IconProps) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <circle cx="30" cy="30" r="24" fill="none" stroke="#444" strokeWidth="2" />
      <circle cx="30" cy="30" r="17" fill="none" stroke="#444" strokeWidth="2" />
      <circle cx="30" cy="30" r="10" fill="none" stroke="#444" strokeWidth="2" />
      <circle cx="30" cy="30" r="5" fill="#c0392b" />
      <line x1="30" y1="4"  x2="30" y2="12" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="48" x2="30" y2="56" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4"  y1="30" x2="12" y2="30" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="30" x2="56" y2="30" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
