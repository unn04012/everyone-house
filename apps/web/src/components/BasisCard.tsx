import { Link } from 'react-router-dom';
import { ProfileCopy } from '../format/profile-copy.js';
import type { ProfileDraft, ProfileField } from '../profile/profile-draft.js';

const SHOWN: readonly ProfileField[] = ['category', 'householdSize', 'residence', 'personalIncome', 'householdAssets'];

/**
 * 판정의 근거가 된 내 값. 집계 숫자를 한 번 더 보여 주는 것보다
 * "무엇을 기준으로 이렇게 나왔는가" 가 결과를 의심할 때 먼저 필요하다.
 */
export function BasisCard({ draft }: { draft: ProfileDraft }) {
  return (
    <div className="card basis">
      <div className="basis__title">이 값으로 판정했어요</div>
      <dl style={{ margin: 0 }}>
        {SHOWN.map((field) => {
          const value = ProfileCopy.valueOf(draft, field);
          return (
            <div className="basis__row" key={field}>
              <dt>{ProfileCopy.labelOf(field)}</dt>
              <dd>{value ?? <span className="chip chip--unknown">{draft.isUnknown(field) ? '모름' : '미입력'}</span>}</dd>
            </div>
          );
        })}
      </dl>
      <Link to="/profile" className="help__toggle" style={{ marginTop: 12 }}>
        프로필 고치기 →
      </Link>
    </div>
  );
}
