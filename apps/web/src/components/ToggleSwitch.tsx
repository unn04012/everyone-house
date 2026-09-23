/** 스위치. 색만으로 상태를 전달하지 않도록 라벨을 옆에 둔다. */
export function ToggleSwitch({ pressed, onChange, label }: { pressed: boolean; onChange: (next: boolean) => void; label: string }) {
  return <button type="button" className="toggle" aria-pressed={pressed} aria-label={label} onClick={() => onChange(!pressed)} />;
}
