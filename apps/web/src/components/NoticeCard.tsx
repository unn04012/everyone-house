import { VerdictEnum } from '@everyone-house/domain/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MatchView, ReasonView } from '../api/api.types.js';
import { Deadline } from '../format/deadline.js';
import { ReasonCopy } from '../format/reason-copy.js';
import { SourceCopy } from '../format/source-copy.js';
import { VerdictCopy } from '../format/verdict-copy.js';
import { ReasonRow } from './ReasonRow.js';
import { SourceBadge } from './SourceBadge.js';
import { StatusBadge } from './StatusBadge.js';
import { ExternalIcon } from './icons.js';

const ACCENT: Record<string, string> = {
  [VerdictEnum.LIKELY_ELIGIBLE]: 'notice--ok',
  [VerdictEnum.NEEDS_REVIEW]: 'notice--review',
  [VerdictEnum.NOT_ELIGIBLE]: 'notice--no',
};

/**
 * 결과 카드.
 *
 * 위계: 판정(왼쪽 액센트 + 뱃지) → 공고명 → 마감 → 사유 → 원문.
 * 신청 가능 카드가 가장 무겁고 미해당이 가장 가볍다 — 이 화면의 일은 분류다.
 * 뱃지만 단독으로 뜨는 카드는 없고(§1-4), 공고문 원문은 모든 카드에 있다(§1-7).
 */
export function NoticeCard({ match, onFix, showBadge = true }: { match: MatchView; onFix?: (field: NonNullable<ReasonView['field']>) => void; showBadge?: boolean }) {
  const [showPassed, setShowPassed] = useState(false);
  const highlighted = match.reasons.filter((reason) => ReasonCopy.isHighlighted(reason.code));
  const passed = match.reasons.filter((reason) => !ReasonCopy.isHighlighted(reason.code));

  const shortDeadline = Deadline.shortLabel(match.closesAt);
  const daysLeft = Deadline.daysLeft(match.closesAt);
  const isUrgent = Deadline.isUrgent(match.closesAt);

  return (
    <article className={`card notice ${ACCENT[match.verdict]}`}>
      <div className="notice__top">
        <div style={{ minWidth: 0 }}>
          {showBadge ? <StatusBadge verdict={match.verdict} /> : <span className="sr-only">{VerdictCopy.of(match.verdict).label}</span>}
          <h3 className="notice__title" style={showBadge ? undefined : { marginTop: 0 }}>
            <Link to={`/notices/${match.noticeId}`} style={{ color: 'inherit' }}>
              {match.title}
            </Link>
          </h3>
          <div className="notice__sub">
            <span>
              <SourceBadge sourceId={match.sourceId} /> {SourceCopy.supplyTypeLabel(match.supplyType)}
            </span>
            {match.categoryLabel && <span>{match.categoryLabel} 계층 기준</span>}
            {match.region && <span>{match.region}</span>}
          </div>
        </div>

        {shortDeadline && (
          <div className={`dday-col${isUrgent ? ' dday-col--urgent' : ''}`}>
            <div className="dday-col__value">{shortDeadline}</div>
            <div className="dday-col__unit">{daysLeft !== null && daysLeft >= 0 ? '접수 마감까지' : '접수 마감'}</div>
          </div>
        )}
      </div>

      {highlighted.length > 0 && (
        <div className="reason-rows">
          {highlighted.map((reason) => (
            <ReasonRow key={`${reason.code}-${reason.field ?? ''}`} reason={reason} onFix={onFix} />
          ))}
        </div>
      )}

      {passed.length > 0 && (
        <div className="passed-line">
          {highlighted.length === 0 ? (
            <>
              확인한 기준 <b>{passed.length}개 모두 통과</b>{' '}
            </>
          ) : (
            <>나머지 {passed.length}개 기준은 통과 </>
          )}
          <button type="button" className="help__toggle" aria-expanded={showPassed} onClick={() => setShowPassed((value) => !value)}>
            {showPassed ? '접기' : '무엇인지 보기'}
          </button>
          {showPassed && (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {passed.map((reason) => (
                <li key={reason.code}>{ReasonCopy.headlineOf(reason)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="notice__foot">
        <a className="notice__pdf" href={match.documentUrl} target="_blank" rel="noreferrer">
          공고문 원문 보기 (PDF)
          <ExternalIcon />
        </a>
        <span className="footnote">{match.ruleset} 기준표</span>
      </div>
    </article>
  );
}
