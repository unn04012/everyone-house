import { AnswerStateEnum, ProfileDraft } from '../profile-draft.js';

describe('ProfileDraft', () => {
  test('미응답 · 모름(null) · 0원을 각각 다른 상태로 구분한다', () => {
    const draft = ProfileDraft.empty().with('carValue', null).with('householdAssets', 0);

    expect(draft.stateOf('personalAssets')).toBe(AnswerStateEnum.EMPTY);
    expect(draft.stateOf('carValue')).toBe(AnswerStateEnum.UNKNOWN);
    expect(draft.stateOf('householdAssets')).toBe(AnswerStateEnum.ZERO);
  });

  test("'모름'도 답한 것으로 센다", () => {
    const draft = ProfileDraft.empty().with('carValue', null);

    expect(draft.isAnswered('carValue')).toBe(true);
    expect(draft.isUnknown('carValue')).toBe(true);
    expect(draft.isAnswered('personalAssets')).toBe(false);
  });

  test('1인 세대면 세대 소득에 본인 소득을 복사한다', () => {
    const draft = ProfileDraft.empty().with('personalIncome', 3_000_000).with('householdSize', 1);

    expect(draft.get('householdIncome')).toBe(3_000_000);
  });

  test('1인 세대에서 본인 소득을 고치면 세대 소득도 따라간다', () => {
    const draft = ProfileDraft.empty().with('householdSize', 1).with('personalIncome', 2_500_000);

    expect(draft.get('householdIncome')).toBe(2_500_000);
  });

  test('2인 이상 세대는 세대 소득을 따로 묻는다', () => {
    const draft = ProfileDraft.empty().with('personalIncome', 3_000_000).with('householdSize', 3);

    expect(draft.get('householdIncome')).toBeUndefined();
  });

  test('수정은 새 인스턴스를 만든다', () => {
    const before = ProfileDraft.empty();
    const after = before.with('householdSize', 2);

    expect(before.get('householdSize')).toBeUndefined();
    expect(after.get('householdSize')).toBe(2);
  });
});
