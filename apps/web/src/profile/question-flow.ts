import { ApplicantCategoryEnum } from '@everyone-house/domain/types';
import type { ProfileDraft, ProfileDraftValues, ProfileField } from './profile-draft.js';

export enum QuestionKindEnum {
  CHOICE = 'CHOICE', // 단일 선택
  AMOUNT = 'AMOUNT', // 금액 (원 단위 정수)
  COUNT = 'COUNT', // 스테퍼
  BOOLEAN = 'BOOLEAN', // 예 / 아니오
  DATE = 'DATE', // 생년월일
  REGION = 'REGION', // 시도 + 자치구
}
export type QuestionKind = keyof typeof QuestionKindEnum;

export interface QuestionChoice {
  value: string;
  label: string;
  sub?: string;
}

/** 정의 도움말. 호버 툴팁이 아니라 그 자리에서 펼친다 (HANDOFF §3) */
export interface QuestionHelp {
  label: string;
  body: string;
  /** 공고문 원문 용어. 사용자가 공고문과 대조할 수 있게 남긴다 (HANDOFF §7) */
  term: string;
}

/** 오입이 잦은 항목은 툴팁으로 감추지 않고 상시 노출한다 */
export interface QuestionGuide {
  title: string;
  items: readonly string[];
}

export interface QuestionDefinition {
  field: ProfileField;
  /** 0 = 없으면 판정 불가, 1 = 비우면 확인 필요 */
  tier: 0 | 1;
  kind: QuestionKind;
  eyebrow: string;
  title: string;
  sub: string;
  help?: QuestionHelp;
  guide?: QuestionGuide;
  choices?: readonly QuestionChoice[];
  /** 금액 에코에 '월 ' 접두를 붙인다 */
  monthly?: boolean;
  /** '잘 모르겠어요'(null) 버튼 문구. 없으면 모름을 허용하지 않는다 */
  unknownLabel?: string;
  /** 0 이 유효한 답인 경우의 문구 (예: '차가 없어요'). 모름과 나란히 놓는다 */
  zeroLabel?: string;
  /** 앞선 답에 따라 건너뛰는 질문 */
  appliesWhen?: (values: ProfileDraftValues) => boolean;
  /** 스테퍼 범위 */
  min?: number;
  max?: number;
}

/** 온보딩 질문 목록. 티어 구분은 HANDOFF §5 를 따른다. */
export class QuestionFlow {
  public static readonly QUESTIONS: readonly QuestionDefinition[] = [
    {
      field: 'category',
      tier: 0,
      kind: QuestionKindEnum.CHOICE,
      eyebrow: '기본 정보',
      title: '어떤 자격으로 신청하실 건가요?',
      sub: '계층에 따라 소득·자산 상한이 달라져요. 나중에 바꿀 수 있어요.',
      choices: [
        { value: ApplicantCategoryEnum.UNIVERSITY_STUDENT, label: '대학생', sub: '재학 중이거나 입학·복학 예정' },
        { value: ApplicantCategoryEnum.YOUTH, label: '청년', sub: '사회초년생·취업준비생 포함' },
        { value: ApplicantCategoryEnum.NEWLYWED, label: '신혼부부', sub: '예비 신혼·한부모 포함' },
        { value: ApplicantCategoryEnum.SENIOR, label: '고령자', sub: '만 65세 이상' },
        { value: ApplicantCategoryEnum.ETC, label: '그 외', sub: '해당하는 게 없어요' },
      ],
      help: {
        label: '어떤 걸 고르면 되나요?',
        body: '지금 상황에 가장 가까운 걸 고르면 돼요. 한 공고에 여러 계층이 있으면 유리한 쪽으로 함께 계산해 드려요.',
        term: "공고문 용어: '신청 자격(공급 대상)'",
      },
    },
    {
      field: 'personalIncome',
      tier: 0,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '기본 정보',
      title: '본인의 세전 월소득을 알려주세요',
      sub: '세금을 떼기 전, 한 달에 버는 돈이에요.',
      monthly: true,
      unknownLabel: '잘 모르겠어요',
      help: {
        label: '본인 월소득이란?',
        body: '세금·4대 보험을 떼기 전 기준의 한 달 소득이에요. 상여금·수당도 포함해요. 연봉만 아신다면 12로 나눈 값을 적어 주세요.',
        term: "공고문 용어: '본인 월평균 소득(세전)'",
      },
    },
    {
      field: 'householdSize',
      tier: 0,
      kind: QuestionKindEnum.COUNT,
      eyebrow: '세대 정보',
      title: '함께 사는 세대원은 몇 명인가요?',
      sub: '본인을 포함한 인원이에요.',
      min: 1,
      max: 10,
      guide: {
        title: '이렇게 세어 주세요',
        items: ['주민등록등본에 함께 올라 있는 사람만 세요.', '본인을 포함해요 — 혼자 살면 1명이에요.', '따로 사는 가족(주소가 다른 부모·형제)은 빼요.'],
      },
    },
    {
      field: 'householdIncome',
      tier: 0,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '세대 정보',
      title: '세대 전체의 세전 월소득을 알려주세요',
      sub: '본인을 포함해 함께 사는 사람들이 버는 돈을 모두 더한 값이에요.',
      monthly: true,
      unknownLabel: '잘 모르겠어요',
      appliesWhen: (values) => (values.householdSize ?? 1) > 1,
      help: {
        label: '누구 소득까지 더하나요?',
        body: '주민등록등본에 함께 올라 있는 사람 중 소득이 있는 사람 전부예요. 미성년 자녀처럼 소득이 없으면 더하지 않아요.',
        term: "공고문 용어: '해당 세대의 월평균 소득(무주택세대구성원 전원)'",
      },
    },
    {
      field: 'livesWithParents',
      tier: 0,
      kind: QuestionKindEnum.BOOLEAN,
      eyebrow: '세대 정보',
      title: '부모님과 같은 세대인가요?',
      sub: '같은 등본에 올라 있는지를 물어보는 거예요.',
      help: {
        label: '왜 물어보나요?',
        body: '청년 계층은 세대주면 세대 전원의 소득을, 세대원이면 본인 소득만 보는 공고가 많아요. 이 답에 따라 비교 대상이 달라져요.',
        term: "공고문 용어: '세대주 / 세대원', '본인과 부모의 월평균 소득'",
      },
    },
    {
      field: 'isHomeless',
      tier: 0,
      kind: QuestionKindEnum.BOOLEAN,
      eyebrow: '기본 정보',
      title: '세대원 모두 집이 없나요?',
      sub: '함께 사는 사람 중 아무도 주택을 갖고 있지 않아야 해요.',
      help: {
        label: '분양권·입주권도 집인가요?',
        body: '네. 분양권·입주권도 주택으로 봐요. 다만 소형·저가주택 등 예외가 있으니 최종 확인은 공고문으로 하세요.',
        term: "공고문 용어: '무주택세대구성원'",
      },
    },
    {
      field: 'birthDate',
      tier: 0,
      kind: QuestionKindEnum.DATE,
      eyebrow: '기본 정보',
      title: '생년월일을 알려주세요',
      sub: '계층별 나이 요건을 확인하는 데에만 써요.',
      help: {
        label: '왜 나이가 아니라 생년월일인가요?',
        body: '나이 기준일이 공고마다 달라요(공고일 기준·입주자 모집공고일 기준 등). 생년월일을 두면 공고마다 정확히 계산할 수 있어요.',
        term: "공고문 용어: '만 19세 이상 만 39세 이하'",
      },
    },
    {
      field: 'residence',
      tier: 0,
      kind: QuestionKindEnum.REGION,
      eyebrow: '기본 정보',
      title: '어디에 사시나요?',
      sub: '자치구까지 알려주시면 순위까지 계산할 수 있어요.',
      help: {
        label: '자치구가 왜 필요한가요?',
        body: '행복주택 우선공급은 주택이 있는 자치구 거주자가 1순위, 같은 시·도 거주자가 2순위예요. 구까지 있어야 순위가 갈려요.',
        term: "공고문 용어: '해당 자치구 거주자 / 해당 시·도 거주자'",
      },
    },

    // ── Tier 1: 비우면 확인 필요로 남는다 ──
    {
      field: 'householdAssets',
      tier: 1,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '자산 정보',
      title: '세대 전체의 총자산은 얼마인가요?',
      sub: '부동산·금융자산·자동차를 더하고 부채를 뺀 값이에요.',
      unknownLabel: '잘 모르겠어요',
      help: {
        label: '총자산에 뭐가 들어가나요?',
        body: '건물·토지·금융자산·자동차·기타 자산을 더한 뒤 금융기관 대출 같은 부채를 빼요. 전세보증금도 자산에 들어가요.',
        term: "공고문 용어: '총자산가액(부동산·금융자산·기타자산 − 부채)'",
      },
    },
    {
      field: 'carValue',
      tier: 1,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '자산 정보',
      title: '보유한 자동차의 가액은 얼마인가요?',
      sub: '세대에 두 대 이상이면 가장 비싼 차 한 대 기준이에요.',
      unknownLabel: '잘 모르겠어요',
      zeroLabel: '차가 없어요 · 0원',
      help: {
        label: '어떤 금액을 적나요?',
        body: '산 가격이 아니라 보험개발원이 매년 내는 차량기준가액이에요. 모르면 비워 두셔도 돼요 — 0원과는 다르게 저장돼요.',
        term: "공고문 용어: '자동차가액(보험개발원 차량기준가액)'",
      },
    },
    {
      field: 'parentsIncome',
      tier: 1,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '부모 정보',
      title: '부모님의 세전 월소득 합계를 알려주세요',
      sub: "'본인과 부모' 기준으로 보는 공고에 써요.",
      monthly: true,
      unknownLabel: '잘 모르겠어요',
      appliesWhen: (values) => values.category === ApplicantCategoryEnum.UNIVERSITY_STUDENT || values.category === ApplicantCategoryEnum.YOUTH,
      help: {
        label: '따로 사는 부모님도 포함하나요?',
        body: "네. '본인과 부모' 기준은 같은 세대인지와 관계없이 부모 소득을 함께 봐요.",
        term: "공고문 용어: '본인과 부모의 월평균 소득'",
      },
    },
    {
      field: 'parentsAssets',
      tier: 1,
      kind: QuestionKindEnum.AMOUNT,
      eyebrow: '부모 정보',
      title: '부모님의 총자산은 얼마인가요?',
      sub: "'본인과 부모' 기준으로 보는 공고의 자산 심사에 써요.",
      unknownLabel: '잘 모르겠어요',
      appliesWhen: (values) => values.category === ApplicantCategoryEnum.UNIVERSITY_STUDENT || values.category === ApplicantCategoryEnum.YOUTH,
      help: {
        label: '무엇까지 더하나요?',
        body: '부모님 명의의 부동산·금융자산·자동차를 더하고 부채를 뺀 값이에요. 정확히 모르면 비워 두셔도 돼요 — 확인 필요로만 남아요.',
        term: "공고문 용어: '본인과 부모의 총자산가액'",
      },
    },
  ];

  /** 앞선 답 기준으로 실제로 물어볼 질문만 남긴다 */
  public static applicable(draft: ProfileDraft, tier: 0 | 1 | 'ALL' = 'ALL'): QuestionDefinition[] {
    const values = draft.values;
    return QuestionFlow.QUESTIONS.filter((question) => {
      if (tier !== 'ALL' && question.tier !== tier) {
        return false;
      }
      return question.appliesWhen ? question.appliesWhen(values) : true;
    });
  }

  public static find(field: string): QuestionDefinition | undefined {
    return QuestionFlow.QUESTIONS.find((question) => question.field === field);
  }

  /** Tier 0 를 모두 답했는가. 하나라도 비면 판정 자체가 안 된다 */
  public static isTier0Complete(draft: ProfileDraft): boolean {
    return QuestionFlow.applicable(draft, 0).every((question) => QuestionFlow.isSatisfied(question, draft));
  }

  /** 다음으로 넘어갈 수 있는가. '모름'(null)도 답이므로 통과시킨다 */
  public static isSatisfied(question: QuestionDefinition, draft: ProfileDraft): boolean {
    if (!draft.isAnswered(question.field)) {
      return false;
    }
    const value = draft.get(question.field);
    if (question.kind === QuestionKindEnum.REGION) {
      return Boolean((value as { province?: string } | null)?.province);
    }
    if (question.kind === QuestionKindEnum.DATE) {
      return typeof value === 'string' && value.length > 0;
    }
    return true;
  }
}
