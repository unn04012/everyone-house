import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../app/api-context.js';
import { useProfile } from '../app/profile-context.js';
import { AppNav } from '../components/AppNav.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { QuestionView } from '../components/QuestionView.js';
import { ChevronLeftIcon } from '../components/icons.js';
import { QuestionFlow } from '../profile/question-flow.js';

/** Tier 0 질문을 한 화면에 하나씩. 진행바는 여기(끝이 정해진 구간)에서만 쓴다. */
export function OnboardingPage() {
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { draft } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const questions = QuestionFlow.applicable(draft, 0);
  const index = Math.min(step, questions.length - 1);
  const question = questions[index];
  const isLast = index === questions.length - 1;
  const canProceed = QuestionFlow.isSatisfied(question, draft);

  const goBack = () => {
    if (index === 0) {
      navigate('/');
      return;
    }
    setStep(index - 1);
  };

  const goNext = async () => {
    if (!isLast) {
      setStep(index + 1);
      return;
    }
    setSaving(true);
    try {
      await apiClient.saveProfile(draft.getValues());
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen">
      <AppNav
        trailing={
          <span className="footnote">
            기본 질문 {index + 1} / {questions.length}
          </span>
        }
      />

      <div className="topbar mobile-only">
        <button type="button" className="topbar__back" aria-label="이전 질문" onClick={goBack}>
          <ChevronLeftIcon />
        </button>
        <ProgressBar current={index} total={questions.length} />
        <span className="footnote">
          {index + 1} / {questions.length}
        </span>
      </div>

      <main className="body onboard">
        <div className="onboard__inner">
          <QuestionView question={question} />

          <div className="cta-row">
            <button type="button" className="btn btn--secondary" onClick={goBack}>
              이전
            </button>
            <button type="button" className="btn btn--primary btn--block" disabled={!canProceed || saving} onClick={goNext}>
              {isLast ? '결과 보기' : '다음'}
            </button>
          </div>
        </div>
      </main>

      <div className="footer mobile-only">
        <button type="button" className="btn btn--primary btn--block" disabled={!canProceed || saving} onClick={goNext}>
          {isLast ? '결과 보기' : '다음'}
        </button>
      </div>
    </div>
  );
}
