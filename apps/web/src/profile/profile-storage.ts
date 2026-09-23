import { ProfileDraft, type ProfileDraftValues } from './profile-draft.js';

/**
 * 프로필 임시 보관. 온보딩 도중 새로고침해도 답이 남아야 한다.
 * 확정 저장은 API 몫이고 여기 값은 캐시다.
 */
export class ProfileStorage {
  private static readonly KEY = 'everyone-house.profile-draft.v1';

  public static load(): ProfileDraft {
    try {
      const raw = window.localStorage.getItem(ProfileStorage.KEY);
      if (!raw) {
        return ProfileDraft.empty();
      }
      // null(모름)과 undefined(미응답)의 구분은 JSON 왕복에서도 유지된다
      return ProfileDraft.fromValues(JSON.parse(raw) as ProfileDraftValues);
    } catch {
      return ProfileDraft.empty();
    }
  }

  public static save(draft: ProfileDraft): void {
    try {
      window.localStorage.setItem(ProfileStorage.KEY, JSON.stringify(draft.getValues()));
    } catch {
      // 사생활 보호 모드 등에서 실패할 수 있다. 저장 실패가 입력을 막지는 않는다
    }
  }

  public static clear(): void {
    try {
      window.localStorage.removeItem(ProfileStorage.KEY);
    } catch {
      // 위와 같다
    }
  }
}
