import { ApplicantCategoryEnum } from '@everyone-house/domain/types';
import { ProfileDraft } from '../profile-draft.js';
import { QuestionFlow } from '../question-flow.js';

describe('QuestionFlow', () => {
  const tier0 = (draft: ProfileDraft) => QuestionFlow.applicable(draft, 0).map((question) => question.field);

  test('1인 세대에는 세대 소득을 묻지 않는다', () => {
    const draft = ProfileDraft.empty().with('householdSize', 1);

    expect(tier0(draft)).not.toContain('householdIncome');
  });

  test('2인 이상 세대에는 세대 소득을 묻는다', () => {
    const draft = ProfileDraft.empty().with('householdSize', 2);

    expect(tier0(draft)).toContain('householdIncome');
  });

  test('부모 소득은 대학생·청년 계층에만 묻는다', () => {
    const youth = ProfileDraft.empty().with('category', ApplicantCategoryEnum.YOUTH);
    const senior = ProfileDraft.empty().with('category', ApplicantCategoryEnum.SENIOR);

    expect(QuestionFlow.applicable(youth, 1).map((question) => question.field)).toContain('parentsIncome');
    expect(QuestionFlow.applicable(senior, 1).map((question) => question.field)).not.toContain('parentsIncome');
  });

  test('시도만 고르면 거주지 질문을 통과시키고, 아무것도 안 고르면 막는다', () => {
    const question = QuestionFlow.find('residence')!;
    const empty = ProfileDraft.empty().with('residence', { province: '', district: null });
    const province = ProfileDraft.empty().with('residence', { province: '서울특별시', district: null });

    expect(QuestionFlow.isSatisfied(question, empty)).toBe(false);
    expect(QuestionFlow.isSatisfied(question, province)).toBe(true);
  });

  test("금액 질문은 '모름'(null)도 답으로 인정한다", () => {
    const question = QuestionFlow.find('personalIncome')!;
    const draft = ProfileDraft.empty().with('personalIncome', null);

    expect(QuestionFlow.isSatisfied(question, draft)).toBe(true);
  });

  test('Tier 0 를 다 채워야 판정을 시작한다', () => {
    const partial = ProfileDraft.empty().with('category', ApplicantCategoryEnum.YOUTH).with('householdSize', 1);
    expect(QuestionFlow.isTier0Complete(partial)).toBe(false);

    const complete = partial
      .with('personalIncome', 3_000_000)
      .with('livesWithParents', false)
      .with('isHomeless', true)
      .with('birthDate', '1995-03-02')
      .with('residence', { province: '서울특별시', district: '강서구' });
    expect(QuestionFlow.isTier0Complete(complete)).toBe(true);
  });
});
