import { useNavigate } from 'react-router-dom';
import { useProfile } from '../app/profile-context.js';
import { AppNav } from '../components/AppNav.js';
import { ProfileCopy } from '../format/profile-copy.js';
import type { ProfileField } from '../profile/profile-draft.js';
import { QuestionFlow } from '../profile/question-flow.js';

interface ProfileSection {
  title: string;
  fields: readonly ProfileField[];
}

const SECTIONS: readonly ProfileSection[] = [
  { title: '기본 정보', fields: ['category', 'birthDate', 'residence', 'isHomeless'] },
  { title: '소득', fields: ['personalIncome', 'householdIncome', 'parentsIncome'] },
  { title: '세대', fields: ['householdSize', 'livesWithParents'] },
  { title: '자산 (비우면 확인 필요로 남아요)', fields: ['householdAssets', 'carValue', 'parentsAssets'] },
];

/** 프로필 확인·수정. '모름'은 회색 칩, '0원'은 값으로 — 둘을 같게 그리지 않는다. */
export function ProfilePage() {
  const navigate = useNavigate();
  const { draft, reset } = useProfile();

  return (
    <div className="screen">
      <AppNav />

      <div className="subhead">
        <div className="container">
          <div>
            <h1>내 프로필</h1>
            <p className="footnote" style={{ color: 'var(--color-muted)' }}>
              이 값으로 공고를 걸러요. 언제든 고칠 수 있어요.
            </p>
          </div>
          <span className="footnote">{QuestionFlow.isTier0Complete(draft) ? '기본 정보 완료' : '기본 정보 미완료'}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="profile-grid">
          {SECTIONS.map((section) => (
            <div className="section" key={section.title}>
              <div className="section__title">{section.title}</div>
              {section.fields.map((field) => {
                const question = QuestionFlow.find(field);
                const value = ProfileCopy.valueOf(draft, field);
                return (
                  <div className="prow" key={field}>
                    <span className="prow__label">{ProfileCopy.labelOf(field)}</span>
                    <span className="prow__cell">
                      {value === null ? <span className="chip chip--unknown">{draft.isUnknown(field) ? '모름' : '미입력'}</span> : <span className="prow__value">{value}</span>}
                      {question && (
                        <button type="button" onClick={() => navigate(`/question/${field}`)}>
                          수정
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/onboarding')}>
            기본 정보 다시 입력
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            프로필 비우기
          </button>
        </div>
      </div>
    </div>
  );
}
