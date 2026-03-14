interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  step?: number;
}

export default function StepToggle({ min, max, value, onChange, label, step = 1 }: Props) {
  return (
    <div className="step-toggle">
      {label && <span className="step-sublabel">{label}</span>}
      <span className="step-value">{value}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="step-slider"
      />
      <div className="step-range-labels">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
