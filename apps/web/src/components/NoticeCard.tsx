import { VerdictEnum } from '@everyone-house/domain/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MatchView, ReasonView } from '../api/api.types.js';
import { Deadline } from '../format/deadline.js';
import { ReasonCopy } from '../format/reason-copy.js';
import { SourceCopy } from '../format/source-copy.js';
import { ReasonCard } from './ReasonCard.js';
import { SourceBadge } from './SourceBadge.js';
import { StatusBadge } from './StatusBadge.js';
import { ExternalIcon } from './icons.js';

/**
 * 결과 카드. 뱃지만 단독으로 뜨는 카드는 없고(§1-4),
 * 공고문 원문 링크는 모든 카드에 항상 있다(§1-7).
 */
export function NoticeCard({ match, onFix }: { match: MatchView; onFix?: (field: NonNullable<ReasonView['field']>) => void }) {
  const [showPassed, setShowPassed] = useState(false);
  const highlighted = match.reasons.filter((reason) => ReasonCopy.isHighlighted(reason.code));
  const passed = match.reasons.filter((reason) => !ReasonCopy.isHighlighted(reason.code));
  const deadline = Deadline.label(match.closesAt);

  return (
    <article className="card notice">
      <div className="notice__head">
        <span className="notice__meta">
          <SourceBadge sourceId={match.sourceId} />
          <h3 className="notice__title">
            <Link to={`/notices/${match.noticeId}`} style={{ color: 'inherit' }}>
              {match.title}
            </Link>
          </h3>
        </span>
        {deadline && <span className={`footnote notice__deadline${Deadline.isUrgent(match.closesAt) ? ' notice__deadline--urgent' : ''}`}>{deadline}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatusBadge verdict={match.verdict} />
        <span className="footnote">
          {SourceCopy.supplyTypeLabel(match.supplyType)}
          {match.categoryLabel ? ` · ${match.categoryLabel} 계층 기준` : ''}
          {match.region ? ` · ${match.region}` : ''}
        </span>
      </div>

      {match.verdict === VerdictEnum.LIKELY_ELIGIBLE && passed.length > 0 && (
        <div className="notice__summary">
          소득·무주택·자산 요건 <b>모든 조건 충족</b> ·{' '}
          <button type="button" className="help__toggle" aria-expanded={showPassed} onClick={() => setShowPassed((value) => !value)}>
            통과 항목 {passed.length}개 {showPassed ? '접기' : '펼쳐 보기'}
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

      {highlighted.length > 0 && (
        <div className="reasons">
          {highlighted.map((reason) => (
            <ReasonCard key={`${reason.code}-${reason.field ?? ''}`} reason={reason} onFix={onFix} />
          ))}
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
