function DartboardSVG() {
  const cx = 50, cy = 50;
  const rings = [
    { r: 46, fill: '#0f0f0f', stroke: '#2a2a2a' },
    { r: 40, fill: '#e8e0cc', stroke: '#333' },
    { r: 34, fill: '#111',    stroke: '#333' },
    { r: 28, fill: '#e8e0cc', stroke: '#333' },
    { r: 22, fill: '#111',    stroke: '#333' },
    { r: 16, fill: '#e8e0cc', stroke: '#333' },
    { r: 10, fill: '#111',    stroke: '#333' },
  ];
  const lines = Array.from({ length: 20 }, (_, i) => {
    const angle = (i * 18 * Math.PI) / 180;
    return {
      x1: cx + 10 * Math.cos(angle), y1: cy + 10 * Math.sin(angle),
      x2: cx + 46 * Math.cos(angle), y2: cy + 46 * Math.sin(angle),
    };
  });
  return (
    <svg viewBox="0 0 100 100" className="loading-dartboard" aria-hidden>
      {rings.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r.r} fill={r.fill} stroke={r.stroke} strokeWidth="0.5" />
      ))}
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#2a2a2a" strokeWidth="0.4" />
      ))}
      <circle cx={cx} cy={cy} r={40} fill="none" stroke="#c0392b" strokeWidth="4" opacity="0.3" />
      <circle cx={cx} cy={cy} r={24} fill="none" stroke="#c0392b" strokeWidth="4" opacity="0.3" />
      <circle cx={cx} cy={cy} r={8}  fill="#27ae60" stroke="#1a1a1a" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={4}  fill="#c0392b" stroke="#1a1a1a" strokeWidth="0.5" />
    </svg>
  );
}

interface Props {
  quick?: boolean;
}

export default function LoadingScreen({ quick }: Props) {
  return (
    <div className={`loading-screen${quick ? ' loading-screen--quick' : ''}`}>
      <DartboardSVG />
      {!quick && <p className="loading-title">Darts Hub</p>}
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
    </div>
  );
}
