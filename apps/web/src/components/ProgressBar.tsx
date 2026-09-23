/**
 * 진행바는 Tier 0 에서만 쓴다 — 끝이 정해지지 않은 단계에 미터를 붙이지 않는다 (HANDOFF §3).
 */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round(((current + 1) / total) * 100)) : 0;
  return (
    <div className="progress" style={{ flex: 1 }} role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label="기본 질문 진행률">
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
