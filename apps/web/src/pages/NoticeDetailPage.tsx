import { VerdictEnum } from '@everyone-house/domain/types';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { NoticeDetailView, ReasonView } from '../api/api.types.js';
import { useApiClient } from '../app/api-context.js';
import { useProfile } from '../app/profile-context.js';
import { AppNav } from '../components/AppNav.js';
import { CriterionRow } from '../components/CriterionRow.js';
import { PassedCriteria } from '../components/PassedCriteria.js';
import { SourceBadge } from '../components/SourceBadge.js';
import { Timeline } from '../components/Timeline.js';
import { ToggleSwitch } from '../components/ToggleSwitch.js';
import { Deadline } from '../format/deadline.js';
import { RangeText } from '../format/range-text.js';
import { SourceCopy } from '../format/source-copy.js';
import { VerdictCopy } from '../format/verdict-copy.js';

const VERDICT_PANEL: Record<string, string> = {
  [VerdictEnum.LIKELY_ELIGIBLE]: 'verdict verdict--ok',
  [VerdictEnum.NEEDS_REVIEW]: 'verdict verdict--review',
  [VerdictEnum.NOT_ELIGIBLE]: 'verdict verdict--no',
};

/**
 * 공고 상세. 알림 메일에서 바로 들어오는 화면이라 위에서부터
 * 판정 요약 → 판정 근거 → 예상 순위 → 공급 → 일정 → 행동 순으로 둔다 (HANDOFF §8).
 */
export function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { draft } = useProfile();

  const [detail, setDetail] = useState<NoticeDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fingerprint = JSON.stringify(draft.getValues());
  const fromEmail = searchParams.get('from') === 'email';

  useEffect(() => {
    if (!noticeId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .fetchNoticeDetail(noticeId, JSON.parse(fingerprint))
      .then((response) => {
        if (!cancelled) {
          setDetail(response);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : '공고를 불러오지 못했어요');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, noticeId, fingerprint]);

  const goFix = useCallback((field: NonNullable<ReasonView['field']>) => navigate(`/question/${field}`), [navigate]);

  const toggleReminder = useCallback(
    async (next: boolean) => {
      if (!detail) {
        return;
      }
      setDetail({ ...detail, reminderEnabled: next });
      await apiClient.setReminder(detail.noticeId, next);
    },
    [apiClient, detail],
  );

  if (loading) {
    return (
      <div className="screen">
        <AppNav />
        <p className="notice-empty">공고를 불러오고 있어요…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="screen">
        <AppNav />
        <p className="notice-empty">{error ?? '공고를 찾을 수 없어요.'}</p>
      </div>
    );
  }

  const deadline = Deadline.label(detail.closesAt);
  const missingField = detail.criteria.find((criterion) => criterion.field)?.field;

  return (
    <div className="screen">
      <AppNav />

      <main className="container detail">
        <div className="crumb">
          <Link to="/">‹ 오늘의 공고 목록</Link>
          {fromEmail && <span className="from-mail">알림 메일에서 열었어요</span>}
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            {/* 제목 + 판정 요약 */}
            <section className="card panel">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <SourceBadge sourceId={detail.sourceId} />
                <span className="footnote" style={{ color: 'var(--color-muted)' }}>
                  {SourceCopy.supplyTypeLabel(detail.supplyType)}
                  {detail.categoryLabel ? ` · ${detail.categoryLabel}` : ''}
                  {deadline ? ` · ${deadline}` : ''}
                </span>
              </span>
              <h1 className="d-title">{detail.title}</h1>
              <div className="meta">
                {detail.region && <span>{detail.region}</span>}
                <span>공급 {RangeText.count(detail.supply.supplyCount, '호')}</span>
                <span>전용 {RangeText.area(detail.supply.areaMin, detail.supply.areaMax)}</span>
              </div>
              <div className={VERDICT_PANEL[detail.verdict]} role="status">
                <div className="verdict__label">{VerdictCopy.of(detail.verdict).label}</div>
                <div className="verdict__text">{detail.summary}</div>
              </div>
            </section>

            {/* 판정 근거 */}
            <section className="card panel">
              <h2>판정 근거</h2>
              {detail.criteria.map((criterion) => (
                <CriterionRow key={`${criterion.code}-${criterion.label}`} criterion={criterion} onFix={goFix} />
              ))}
              <PassedCriteria items={detail.passed} />
            </section>

            {/* 예상 순위 */}
            <section className="card panel">
              <h2>
                예상 순위{' '}
                <span className="footnote" style={{ fontWeight: 500 }}>
                  · 자격과 별개로, 당첨 가능성
                </span>
              </h2>
              <div className="stat-grid stat-grid--pair" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat">
                  <div className="stat__k">거주지 순위</div>
                  <div className="stat__v">{detail.rank.residenceRank ?? '알 수 없음'}</div>
                  {detail.rank.residenceNote && (
                    <div className="footnote" style={{ marginTop: 4 }}>
                      {detail.rank.residenceNote}
                    </div>
                  )}
                </div>
                <div className={detail.rank.movedInBonus ? 'stat' : 'stat stat--empty'}>
                  <div className="stat__k">전입 기간 가점</div>
                  <div className={detail.rank.movedInBonus ? 'stat__v' : 'stat__v stat__v--empty'}>{detail.rank.movedInBonus ?? '알 수 없음'}</div>
                  {!detail.rank.movedInBonus && (
                    <button type="button" className="help__toggle" style={{ marginTop: 4 }} onClick={() => navigate('/profile')}>
                      전입일 입력 →
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 공급 정보 */}
            <section className="card panel">
              <h2>공급 정보</h2>
              <div className="stat-grid">
                <div className="stat">
                  <div className="stat__k">공급</div>
                  <div className="stat__v">{RangeText.count(detail.supply.supplyCount, '호')}</div>
                </div>
                <div className="stat">
                  <div className="stat__k">전용면적</div>
                  <div className="stat__v">{RangeText.area(detail.supply.areaMin, detail.supply.areaMax)}</div>
                </div>
                <div className="stat">
                  <div className="stat__k">임대보증금</div>
                  <div className="stat__v">{RangeText.money(detail.supply.depositMin, detail.supply.depositMax)}</div>
                </div>
                <div className="stat">
                  <div className="stat__k">월 임대료</div>
                  <div className="stat__v">{RangeText.money(detail.supply.rentMin, detail.supply.rentMax)}</div>
                </div>
              </div>
              <p className="footnote" style={{ margin: '12px 0 0' }}>
                임대료는 주택별로 달라요. 주택 목록은 공고문 별첨에 있어요.
              </p>
            </section>

            {/* 일정 */}
            <section className="card panel">
              <h2>일정</h2>
              <Timeline steps={detail.schedule} />
            </section>

            {/* 마감 리마인더 */}
            <section className="card panel reminder">
              <div>
                <div className="reminder__title">마감 전 다시 알려주기</div>
                <div className="footnote" style={{ color: 'var(--color-muted)' }}>
                  마감 2일 전 메일로
                </div>
              </div>
              <ToggleSwitch pressed={detail.reminderEnabled} onChange={toggleReminder} label="마감 리마인더" />
            </section>

            <p className="footnote" style={{ lineHeight: 1.6, margin: 0 }}>
              {detail.ruleset} 기준표로 판정 · 자동 판정은 1차 필터예요. 최종 자격은 공고문 원문과 실제 심사로 확정됩니다.
            </p>
          </div>

          {/* 데스크톱 rail */}
          <aside className="rail-only">
            <div className="card rail-card">
              <div className="footnote" style={{ color: 'var(--color-muted)' }}>
                접수 마감까지
              </div>
              <div className="dday">{deadline?.replace('마감 ', '') ?? '미상'}</div>
              <div className="footnote" style={{ color: 'var(--color-muted)', marginBottom: 18 }}>
                {detail.closesAtText ?? '마감일이 공고문에만 있어요'}
              </div>
              <a className="btn btn--primary btn--block" id="document" href={detail.documentUrl} target="_blank" rel="noreferrer" style={{ height: 50, marginBottom: 10 }}>
                공고문 원문 (PDF)
              </a>
              {detail.applyUrl && (
                <a className="btn btn--secondary btn--block" href={detail.applyUrl} target="_blank" rel="noreferrer" style={{ height: 48, fontSize: 14.5 }}>
                  신청 사이트에서 신청 ↗
                </a>
              )}
            </div>

            {missingField && (
              <div className="banner">
                <div className="banner__title">한 가지만 채우면 이 공고가 확정돼요</div>
                <button type="button" className="btn btn--primary btn--block banner__action" onClick={() => goFix(missingField)}>
                  입력하러 가기
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* 모바일 하단 고정 액션 */}
      <div className="actionbar">
        {detail.applyUrl && (
          <a className="btn btn--secondary" href={detail.applyUrl} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
            신청 사이트
          </a>
        )}
        <a className="btn btn--primary" href={detail.documentUrl} target="_blank" rel="noreferrer" style={{ flex: 1.4 }}>
          공고문 원문
        </a>
      </div>
    </div>
  );
}
