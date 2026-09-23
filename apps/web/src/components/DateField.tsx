import { ProfileCopy } from '../format/profile-copy.js';

/** 생년월일. 나이가 아니라 날짜를 받는다 — 기준일이 공고마다 다르다. */
export function DateField({ value, onChange, label }: { value: string | undefined; onChange: (next: string) => void; label: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="field">
      <input className="field__input" type="date" aria-label={label} max={today} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      {value && <span className="footnote">{ProfileCopy.birthDateLabel(value)}</span>}
    </div>
  );
}
