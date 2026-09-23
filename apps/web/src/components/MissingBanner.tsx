import { Josa } from '../format/josa.js';
import { ProfileCopy } from '../format/profile-copy.js';
import type { MissingFieldSummary } from '../result/result-digest.js';

/** 집계 유도 배너. 경고가 아니라 다음 행동을 제안하는 톤이다. */
export function MissingBanner({ summary, onFix }: { summary: MissingFieldSummary; onFix: (field: MissingFieldSummary['field']) => void }) {
  const label = ProfileCopy.labelOf(summary.field);
  return (
    <div className="banner">
      <div className="banner__title">
        {Josa.attach(label, '을/를')} 채우면 확인 필요 {summary.count}건이 확정돼요
      </div>
      <button type="button" className="btn btn--primary btn--block banner__action" onClick={() => onFix(summary.field)}>
        {label} 입력하기
      </button>
    </div>
  );
}
