import { ApplicantCategoryEnum, type ApplicantCategory, type LocationSchema } from '@everyone-house/domain/types';
import type { ProfileDraft, ProfileField } from '../profile/profile-draft.js';
import { KoreanMoney } from './korean-money.js';

/** 프로필 화면의 행 표기. '모름(null)' 과 '0원' 을 절대 같게 그리지 않는다 (HANDOFF §1-1). */
export class ProfileCopy {
  private static readonly LABELS: Record<ProfileField, string> = {
    category: '신청 계층',
    personalIncome: '본인 월소득',
    householdSize: '세대원 수',
    householdIncome: '세대 월소득',
    livesWithParents: '부모와 같은 세대',
    isHomeless: '무주택 여부',
    birthDate: '생년월일',
    residence: '거주지',
    householdAssets: '세대 총자산',
    personalAssets: '본인 총자산',
    carValue: '자동차가액',
    parentsIncome: '부모 월소득',
    parentsAssets: '부모 총자산',
  };

  private static readonly CATEGORIES: Record<ApplicantCategory, string> = {
    [ApplicantCategoryEnum.UNIVERSITY_STUDENT]: '대학생',
    [ApplicantCategoryEnum.YOUTH]: '청년',
    [ApplicantCategoryEnum.NEWLYWED]: '신혼부부',
    [ApplicantCategoryEnum.SENIOR]: '고령자',
    [ApplicantCategoryEnum.ETC]: '그 외',
  };

  private static readonly MONTHLY_FIELDS: readonly ProfileField[] = ['personalIncome', 'householdIncome', 'parentsIncome'];

  public static labelOf(field: ProfileField): string {
    return ProfileCopy.LABELS[field];
  }

  public static categoryLabel(category: ApplicantCategory): string {
    return ProfileCopy.CATEGORIES[category];
  }

  public static locationLabel(location: LocationSchema): string {
    return location.district ? `${location.province} ${location.district}` : location.province;
  }

  /**
   * 행에 표시할 값. null(모름)·미응답은 문자열을 만들지 않고 null 을 돌려준다 —
   * 호출부가 회색 칩으로 그린다.
   */
  public static valueOf(draft: ProfileDraft, field: ProfileField): string | null {
    const value = draft.get(field);
    if (value === undefined || value === null) {
      return null;
    }
    switch (field) {
      case 'category':
        return ProfileCopy.categoryLabel(value as ApplicantCategory);
      case 'residence':
        return ProfileCopy.locationLabel(value as LocationSchema);
      case 'householdSize':
        return `${value as number}명`;
      case 'birthDate':
        return ProfileCopy.birthDateLabel(value as string);
      case 'livesWithParents':
      case 'isHomeless':
        return (value as boolean) ? '예' : '아니요';
      default: {
        const won = value as number;
        return ProfileCopy.MONTHLY_FIELDS.includes(field) ? KoreanMoney.formatMonthly(won) : KoreanMoney.format(won);
      }
    }
  }

  /** '1995-03-02' → '1995년 3월 2일 (만 30세)' */
  public static birthDateLabel(birthDate: string, now: Date = new Date()): string {
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) {
      return birthDate;
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (만 ${ProfileCopy.ageOf(birthDate, now)}세)`;
  }

  /** 만 나이. 판정은 서버가 하지만 화면 확인용으로 계산한다 */
  public static ageOf(birthDate: string, now: Date = new Date()): number {
    const date = new Date(birthDate);
    let age = now.getFullYear() - date.getFullYear();
    const beforeBirthday = now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
    if (beforeBirthday) {
      age -= 1;
    }
    return age;
  }
}
