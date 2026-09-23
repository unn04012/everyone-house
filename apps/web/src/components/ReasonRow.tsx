import type { ReasonView } from '../api/api.types.js';
import { KoreanMoney } from '../format/korean-money.js';
import { ReasonCopy, ReasonToneEnum } from '../format/reason-copy.js';

/**
 * 사유 한 줄. 카드 안에 또 카드를 그리지 않는다 — 헤어라인으로만 나눈다.
 * 예외는 `MISSING_PROFILE_DATA`: 지금 해결할 수 있는 항목이라
 * 핸드오프 §4 가 시각적 구분을 요구한다.
 */
export function ReasonRow({ reason, onFix }: { reason: ReasonView; onFix?: (field: NonNullable<ReasonView['field']>) => void }) {
  const tone = ReasonCopy.toneOf(reason.code);
  const subject = ReasonCopy.subjectOf(reason.code);

  if (tone === ReasonToneEnum.MISSING) {
    return (
      <div className="reason-fix">
        <span className="reason-fix__text">{ReasonCopy.headlineOf(reason)}</span>
        {reason.field && onFix && (
          <button type="button" className="reason__action" onClick={() => onFix(reason.field!)}>
            입력하러 가기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="reason-row">
      <div className="reason-row__main">
        <div className="reason-row__title">{ReasonCopy.headlineOf(reason)}</div>

        {tone === ReasonToneEnum.BORDERLINE && reason.detail && (
          <div className="meter" role="img" aria-label={`기준의 ${Math.round(reason.detail.ratio * 100)}%`}>
            <div className="meter__fill" style={{ width: `${Math.min(100, Math.round(reason.detail.ratio * 100))}%` }} />
          </div>
        )}

        {reason.detail && subject && (
          <div className="reason-row__values">
            내 {subject} <b>{KoreanMoney.format(reason.detail.actual)}</b> / 기준 {KoreanMoney.format(reason.detail.limit)}
          </div>
        )}

        {tone === ReasonToneEnum.SYSTEM && <div className="reason-row__values">아래 공고문 원문에서 직접 확인해 주세요.</div>}
      </div>
    </div>
  );
}
