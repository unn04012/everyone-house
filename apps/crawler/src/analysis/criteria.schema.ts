import { z } from 'zod';

/** 구조화 출력 스키마. NoticeCriteria 와 1:1 대응한다. */
export const rankRuleSchema = z.object({
  rank: z.number().int().min(1).describe('순위 번호 (1, 2, 3 ...)'),
  basis: z.enum(['RESIDENCE', 'SUBSCRIPTION', 'INCOME', 'MIXED', 'OTHER']).describe('순위를 가르는 축'),
  condition: z.string().describe('공고문 표현 그대로의 순위 조건'),
  regions: z.array(z.string()).describe("지역 기준일 때 해당 지역 목록. 예: ['서울특별시', '경기도 성남시']. 아니면 빈 배열"),
  requiredSubscriptionPayments: z.number().int().nullable().describe('청약저축 기준일 때 필요한 납입회차. 아니면 null'),
  isPrioritySupply: z.boolean().describe('우선공급 순위인가 (일반공급이면 false)'),
});

export const categoryRuleSchema = z.object({
  categoryLabel: z.string().describe("공고문 표기 그대로의 계층명. 예: '청년', '신혼부부'"),
  urbanWorkerIncomePercent: z.number().nullable().describe('전년도 도시근로자 가구원수별 월평균소득 기준 %. 아니면 null'),
  medianIncomePercent: z.number().nullable().describe('기준 중위소득 기준 %. 아니면 null'),
  totalAssetsLimit: z.number().nullable().describe('총자산 상한 (원 단위 정수). 예: 2억5100만 → 251000000'),
  carValueLimit: z.number().nullable().describe('자동차가액 상한 (원 단위 정수)'),
  requiresHomeless: z.boolean().describe('무주택 요건이 있는가'),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  maritalRequirement: z.string().nullable().describe("혼인 관련 제약. 예: '혼인 중이 아닐 것'. 없으면 null"),
});

export const noticeCriteriaSchema = z.object({
  applicationStartDate: z.string().nullable().describe('접수 시작일 YYYY-MM-DD. 모르면 null'),
  applicationEndDate: z.string().nullable().describe('접수 종료일 YYYY-MM-DD. 모르면 null'),
  announcementDate: z.string().nullable().describe('입주자모집공고일 YYYY-MM-DD (자격 판단 기준일)'),
  categories: z.array(categoryRuleSchema).describe('계층별 자격 기준'),
  ranks: z.array(rankRuleSchema).describe('순위 규칙. 우선공급과 일반공급을 모두 포함'),
  manualCheckNotes: z.array(z.string()).describe('자동 판정이 어려워 사람이 확인해야 하는 조건'),
  uncertainNotes: z.array(z.string()).describe('공고문에서 찾지 못했거나 확신이 서지 않는 항목'),
});
