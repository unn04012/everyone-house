import { ReasonCodeEnum } from '@everyone-house/domain/types';
import type { ReasonView } from '../api/api.types.js';
import { KoreanMoney } from '../format/korean-money.js';
import { ReasonCopy, ReasonToneEnum } from '../format/reason-copy.js';

/**
 * 사유 한 건. `MISSING_PROFILE_DATA`(지금 해결 가능)만 시각적으로 구분한다 (HANDOFF §4).
 */
export function ReasonCard({ reason, onFix }: { reason: ReasonView; onFix?: (field: NonNullable<ReasonView['field']>) => void }) {
  const tone = ReasonCopy.toneOf(reason.code);
  const isMissing = tone === ReasonToneEnum.MISSING;
  const subject = ReasonCopy.subjectOf(reason.code);

  return (
    <div className={isMissing ? 'reason reason--missing' : 'reason'} style={isMissing ? { display: 'flex', flexDirection: 'column', justifyContent: 'center' } : undefined}>
      <div className="reason__head">{ReasonCopy.headlineOf(reason)}</div>

      {tone === ReasonToneEnum.BORDERLINE && reason.detail && (
        <div className="meter" style={{ marginBottom: 8 }} role="img" aria-label={`기준의 ${Math.round(reason.detail.ratio * 100)}퍼센트`}>
          <div className="meter__fill" style={{ width: `${Math.min(100, Math.round(reason.detail.ratio * 100))}%` }} />
        </div>
      )}

      {reason.detail && subject && (
        <div className="reason__compare">
          <span>
            내 {subject} <b>{KoreanMoney.format(reason.detail.actual)}</b>
          </span>
          <span>기준 {KoreanMoney.format(reason.detail.limit)}</span>
        </div>
      )}

      {isMissing && reason.field && onFix && (
        <button type="button" className="reason__action" onClick={() => onFix(reason.field!)}>
          입력하러 가기
        </button>
      )}

      {reason.code === ReasonCodeEnum.MANUAL_CHECK_REQUIRED && (
        <div className="footnote" style={{ marginTop: 8 }}>
          아래 공고문에서 직접 확인해 주세요.
        </div>
      )}
      {reason.code === ReasonCodeEnum.NO_RULE_DATA && (
        <div className="footnote" style={{ marginTop: 8 }}>
          자동 판정이 닿지 않는 유형이에요.
        </div>
      )}
    </div>
  );
}
