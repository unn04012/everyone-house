/** 세대원 수 같은 소규모 정수 입력. */
export function Stepper({ value, onChange, label, min = 1, max = 10 }: { value: number | undefined; onChange: (next: number) => void; label: string; min?: number; max?: number }) {
  const current = value ?? min;
  return (
    <div className="stepper">
      <button type="button" className="stepper__btn" aria-label={`${label} 줄이기`} disabled={current <= min} onClick={() => onChange(Math.max(min, current - 1))}>
        −
      </button>
      <div>
        <div className="stepper__value" aria-live="polite">
          {current}
        </div>
        <div className="footnote" style={{ textAlign: 'center', marginTop: 6 }}>
          명
        </div>
      </div>
      <button
        type="button"
        className="stepper__btn stepper__btn--plus"
        aria-label={`${label} 늘리기`}
        disabled={current >= max}
        onClick={() => onChange(Math.min(max, current + 1))}
      >
        +
      </button>
    </div>
  );
}
