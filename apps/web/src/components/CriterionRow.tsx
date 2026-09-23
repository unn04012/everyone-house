import { ReasonCodeEnum } from '@everyone-house/domain/types';
import type { CriterionView, ReasonView } from '../api/api.types.js';
import { KoreanMoney } from '../format/korean-money.js';
import { ReasonCopy, ReasonToneEnum } from '../format/reason-copy.js';

/**
 * 판정 근거 한 줄. 걸린 항목만 펼치고, 통과 항목은 접어 둔다 (HANDOFF §8).
 * `모름` 은 회색 칩으로 — 0원과 절대 같게 그리지 않는다.
 */
export function CriterionRow({ criterion, onFix }: { criterion: CriterionView; onFix?: (field: NonNullable<ReasonView['field']>) => void }) {
  const tone = ReasonCopy.toneOf(criterion.code);
  const isMissing = tone === ReasonToneEnum.MISSING;
  const isManual = tone === ReasonToneEnum.SYSTEM;

  return (
    <div className="crit" data-reason={criterion.code}>
      <div className="crit__head">
        <span className="crit__name">
          <span className={`pill ${isManual ? 'pill--manual' : tone === ReasonToneEnum.BLOCKING ? 'pill--no' : 'pill--review'}`}>
            {isManual ? '직접 확인' : tone === ReasonToneEnum.BLOCKING ? '안 맞음' : '확인 필요'}
          </span>
          {criterion.label}
        </span>

        {criterion.detail && (
          <span className="crit__vals">
            {isMissing ? <span className="chip chip--unknown">모름</span> : <b>{KoreanMoney.format(criterion.detail.actual)}</b>}{' '}
            <span className="std">/ {KoreanMoney.format(criterion.detail.limit)} 이하</span>
          </span>
        )}

        {isManual && criterion.documentPage !== null && (
          <a className="crit__link" href="#document">
            공고문 p.{criterion.documentPage} 보기 →
          </a>
        )}
      </div>

      {tone === ReasonToneEnum.BORDERLINE && criterion.detail && (
        <div className="meter" style={{ marginBottom: 9 }} role="img" aria-label={`기준의 ${Math.round(criterion.detail.ratio * 100)}%`}>
          <div className="meter__fill" style={{ width: `${Math.min(100, Math.round(criterion.detail.ratio * 100))}%` }} />
        </div>
      )}

      {isMissing && (
        <div className="reason reason--missing fix">
          <span className="fix__text">{criterion.message}</span>
          {criterion.field && onFix && (
            <button type="button" className="reason__action" onClick={() => onFix(criterion.field!)}>
              {criterion.label} 입력
            </button>
          )}
        </div>
      )}

      {criterion.note && <div className="crit__note">{criterion.note}</div>}
      {criterion.term && <div className="help__term">{criterion.term}</div>}
      {criterion.code === ReasonCodeEnum.NO_RULE_DATA && <div className="footnote">자동 판정이 닿지 않는 유형이에요.</div>}
    </div>
  );
}
