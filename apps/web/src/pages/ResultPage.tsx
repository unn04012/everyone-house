import { VerdictEnum } from '@everyone-house/domain/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReasonView } from '../api/api.types.js';
import { useApiClient } from '../app/api-context.js';
import { useProfile } from '../app/profile-context.js';
import { AppNav } from '../components/AppNav.js';
import { BasisCard } from '../components/BasisCard.js';
import { MissingBanner } from '../components/MissingBanner.js';
import { NoticeCard } from '../components/NoticeCard.js';
import { ResultSkeleton } from '../components/ResultSkeleton.js';
import { ChevronDownIcon, ChevronUpIcon, MinusCircleIcon } from '../components/icons.js';
import { QuestionFlow } from '../profile/question-flow.js';
import { ResultDigest } from '../result/result-digest.js';

/** 접힘 없이 보여 주는 묶음. 순서는 적합 → 확인 필요 (HANDOFF §4) */
const GROUPS = [
  { verdict: VerdictEnum.LIKELY_ELIGIBLE, title: '지금 신청할 수 있어 보여요', modifier: 'group-head--ok' },
  { verdict: VerdictEnum.NEEDS_REVIEW, title: '확인이 필요해요', modifier: 'group-head--review' },
] as const;

/** 결과 목록. 정렬은 적합 → 확인 필요 → 미해당, 미해당은 기본 접힘 (HANDOFF §4). */
export function ResultPage() {
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { draft } = useProfile();
  const [digest, setDigest] = useState<ResultDigest>(() => ResultDigest.empty());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotEligible, setShowNotEligible] = useState(false);

  const ready = QuestionFlow.isTier0Complete(draft);
  const values = draft.getValues();
  const fingerprint = JSON.stringify(values);

  useEffect(() => {
    if (!ready) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .fetchResults(JSON.parse(fingerprint))
      .then((response) => {
        if (!cancelled) {
          setDigest(ResultDigest.from(response.matches, response.collectedToday));
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : '결과를 불러오지 못했어요');
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
  }, [apiClient, ready, fingerprint]);

  const goFix = useCallback((field: NonNullable<ReasonView['field']>) => navigate(`/question/${field}`), [navigate]);

  if (!ready) {
    return (
      <div className="screen">
        <AppNav />
        <main className="body">
          <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
            <span className="eyebrow">시작하기</span>
            <h1 className="q-title">먼저 기본 정보를 알려주세요</h1>
            <p className="q-sub">소득·세대·거주지 정보가 있어야 공고를 내 기준으로 걸러낼 수 있어요. 2분이면 끝나요.</p>
            <button type="button" className="btn btn--primary btn--block" style={{ marginTop: 28 }} onClick={() => navigate('/onboarding')}>
              기본 정보 입력하기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const missing = digest.topMissingField;
  const notEligible = digest.notEligible;

  return (
    <div className="screen">
      <AppNav />

      <div className="subhead">
        <div className="container">
          <div>
            <h1>내 조건에 맞는 공고</h1>
            {/* 로딩 중에 0 을 보여주면 '오늘 공고가 없다' 로 읽힌다 */}
            <p className="footnote" style={{ color: 'var(--color-muted)' }}>
              {loading ? '오늘 들어온 공고를 내 기준으로 맞춰 보는 중이에요' : `오늘 수집한 ${digest.collectedToday}건을 내 기준으로 걸렀어요`}
            </p>
          </div>
          <span className="footnote">정렬: 판정순</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {loading && <ResultSkeleton />}
        {error && <p className="notice-empty">{error}</p>}

        {!loading && !error && (
          <div className="result-layout">
            <div className="stack">
              {digest.isEmpty && <p className="notice-empty">오늘 새로 들어온 공고가 없어요.</p>}

              {/* 판정별로 묶는다. 뱃지를 카드마다 반복하는 대신 묶음이 상태를 진다 */}
              {GROUPS.map(({ verdict, title, modifier }) => {
                const matches = digest.of(verdict);
                if (matches.length === 0) {
                  return null;
                }
                return (
                  <div key={verdict} className="stack">
                    <div className={`group-head ${modifier}`}>
                      <span className="group-head__title">{title}</span>
                      <span className="group-head__count">{matches.length}건</span>
                      <span className="group-head__rule" aria-hidden="true" />
                    </div>
                    {matches.map((match) => (
                      <NoticeCard key={match.matchId} match={match} onFix={goFix} showBadge={false} />
                    ))}
                  </div>
                );
              })}

              {notEligible.length > 0 && (
                <>
                  <button type="button" className="collapsed-group" aria-expanded={showNotEligible} onClick={() => setShowNotEligible((value) => !value)}>
                    <span className="collapsed-group__label">
                      <MinusCircleIcon />
                      조건에 안 맞아요 · {notEligible.length}건
                    </span>
                    {showNotEligible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                  {showNotEligible && notEligible.map((match) => <NoticeCard key={match.matchId} match={match} onFix={goFix} />)}
                </>
              )}
            </div>

            <aside className="rail">
              {missing && <MissingBanner summary={missing} onFix={goFix} />}
              <BasisCard draft={draft} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
