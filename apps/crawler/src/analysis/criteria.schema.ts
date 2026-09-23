import { z } from 'zod';

/** 구조화 출력 스키마. NoticeCriteria 와 1:1 대응한다. */
export const rankRuleSchema = z.object({
  rank: z.number().int().min(1).describe('순위 번호 (1, 2, 3 ...)'),
  appliesTo: z
    .string()
    .nullable()
    .describe("이 순위가 적용되는 대상 구분. 면적대별로 순위가 다르면 면적을(예: '전용 50㎡ 미만'), 계층별로 다르면 계층을(예: '청년 계층') 적는다. 구분이 없으면 null"),
  basis: z.enum(['RESIDENCE', 'SUBSCRIPTION', 'INCOME', 'MIXED', 'OTHER']).describe('순위를 가르는 축'),
  condition: z.string().describe('공고문 표현 그대로의 순위 조건'),
  regions: z.array(z.string()).describe("지역 기준일 때 해당 지역 목록. 예: ['서울특별시', '경기도 성남시']. 아니면 빈 배열"),
  requiredSubscriptionPayments: z.number().int().nullable().describe('청약저축 기준일 때 필요한 납입회차. 아니면 null'),
  isPrioritySupply: z.boolean().describe('우선공급 순위인가 (일반공급이면 false)'),
});

export const categoryRuleSchema = z.object({
  categoryLabel: z.string().describe("공고문 표기 그대로의 계층명. 예: '청년', '신혼부부'"),
  applicantScope: z
    .enum(['SELF', 'SELF_AND_PARENTS', 'HOUSEHOLD', 'SELF_IF_NOT_HOUSEHOLDER'])
    .describe(
      "소득·자산을 누구 기준으로 보는지. 공고문 문구를 그대로 따른다. " +
        "'본인의 월평균 소득' → SELF. '본인과 부모의' → SELF_AND_PARENTS. " +
        "'해당 세대의'(무주택세대구성원 전원) → HOUSEHOLD. " +
        "'세대주인 경우 전원, 세대원인 경우 본인만' → SELF_IF_NOT_HOUSEHOLDER",
    ),
  urbanWorkerIncomePercent: z.number().nullable().describe('전년도 도시근로자 가구원수별 월평균소득 기준 %. 아니면 null'),
  medianIncomePercent: z.number().nullable().describe('기준 중위소득 기준 %. 아니면 null'),
  totalAssetsLimit: z.number().nullable().describe('총자산 상한 (원 단위 정수). 예: 2억5100만 → 251000000'),
  carValueLimit: z.number().nullable().describe('자동차가액 상한 (원 단위 정수)'),
  requiresHomeless: z.boolean().describe('무주택 요건이 있는가'),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  maritalRequirement: z.string().nullable().describe("혼인 관련 제약. 예: '혼인 중이 아닐 것'. 없으면 null"),
});

export const incomeTableRowSchema = z.object({
  percent: z.number().describe('기준 비율 (%). 예: 100, 110, 120, 130, 140'),
  basis: z.enum(['URBAN_WORKER_AVERAGE', 'MEDIAN_INCOME']).describe('도시근로자 월평균소득 기준인지 기준 중위소득 기준인지'),
  amounts: z
    .array(
      z.object({
        householdSize: z.number().int().min(1).describe('가구원수'),
        amount: z.number().describe('해당 가구원수의 월 금액(원)'),
      }),
    )
    .describe("표의 각 칸을 가구원수와 금액 쌍으로 옮긴다. 예: [{householdSize:1, amount:4576036}, {householdSize:2, amount:6452897}]. '-' 로 빈 칸은 넣지 않는다"),
  appliesTo: z.string().nullable().describe("이 행이 적용되는 대상. 예: '공통', '맞벌이 신혼부부'. 구분이 없으면 null"),
});

export const noticeCriteriaSchema = z.object({
  applicationStartDate: z.string().nullable().describe('접수 시작일 YYYY-MM-DD. 모르면 null'),
  applicationEndDate: z.string().nullable().describe('접수 종료일 YYYY-MM-DD. 모르면 null'),
  announcementDate: z.string().nullable().describe('입주자모집공고일 YYYY-MM-DD (자격 판단 기준일)'),
  categories: z.array(categoryRuleSchema).describe('계층별 자격 기준'),
  ranks: z.array(rankRuleSchema).describe('순위 규칙. 우선공급과 일반공급을 모두 포함'),
  incomeTable: z
    .array(incomeTableRowSchema)
    .describe('공고문에 실린 가구원수별 소득 금액표를 그대로 옮긴다. 표의 금액에는 1인 +20%p, 2인 +10%p 가산이 이미 반영돼 있으므로 다시 계산하지 말고 적힌 숫자를 그대로 쓴다. 표가 없으면 빈 배열'),
  manualCheckNotes: z.array(z.string()).describe('자동 판정이 어려워 사람이 확인해야 하는 조건'),
  uncertainNotes: z.array(z.string()).describe('공고문에서 찾지 못했거나 확신이 서지 않는 항목'),
});
