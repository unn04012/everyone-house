import { useNavigate, useParams } from 'react-router-dom';
import { useApiClient } from '../app/api-context.js';
import { useProfile } from '../app/profile-context.js';
import { AppNav } from '../components/AppNav.js';
import { QuestionView } from '../components/QuestionView.js';
import { ChevronLeftIcon } from '../components/icons.js';
import { QuestionFlow } from '../profile/question-flow.js';

/**
 * 질문 하나만 고치는 화면. 결과 카드의 '입력하러 가기' 와 프로필 수정이 여기로 온다.
 * Tier 1 질문은 진행바를 붙이지 않는다 — 끝이 정해진 구간이 아니다 (HANDOFF §3).
 */
export function QuestionPage() {
  const { field } = useParams<{ field: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { draft } = useProfile();
  const question = field ? QuestionFlow.find(field) : undefined;

  if (!question) {
    return (
      <div className="screen">
        <AppNav />
        <main className="body">
          <p className="notice-empty">찾을 수 없는 항목이에요.</p>
        </main>
      </div>
    );
  }

  const save = async () => {
    await apiClient.saveProfile(draft.getValues());
    navigate(-1);
  };

  return (
    <div className="screen">
      <AppNav desktopOnly trailing={<span className="footnote">{question.tier === 0 ? '기본 정보' : '추가 정보'}</span>} />

      <div className="topbar mobile-only">
        <button type="button" className="topbar__back" aria-label="뒤로" onClick={() => navigate(-1)}>
          <ChevronLeftIcon />
        </button>
        <span style={{ fontWeight: 700 }}>프로필 수정</span>
      </div>

      <main className="body onboard">
        <div className="onboard__inner">
          <QuestionView question={question} />
          <div className="cta-row">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)}>
              취소
            </button>
            <button type="button" className="btn btn--primary btn--block" disabled={!QuestionFlow.isSatisfied(question, draft)} onClick={save}>
              저장하고 돌아가기
            </button>
          </div>
        </div>
      </main>

      <div className="footer mobile-only">
        <button type="button" className="btn btn--primary btn--block" disabled={!QuestionFlow.isSatisfied(question, draft)} onClick={save}>
          저장하고 돌아가기
        </button>
      </div>
    </div>
  );
}
