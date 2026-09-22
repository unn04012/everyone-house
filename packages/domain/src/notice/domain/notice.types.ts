export enum SourceIdEnum {
  MYHOME_API = 'MYHOME_API',
  SH_PORTAL = 'SH_PORTAL',
  GH_APPLY = 'GH_APPLY',
}
export type SourceId = keyof typeof SourceIdEnum;

/** 모집 상태. 소스별 표기(모집중/공고중/접수중/모집마감/접수마감)를 이 세 값으로 정규화한다. */
export enum NoticeStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  UNKNOWN = 'UNKNOWN',
}
export type NoticeStatus = keyof typeof NoticeStatusEnum;

/**
 * 공급 유형. 자격 판정의 분기 기준이 되므로 소득 기준 체계별로 묶어 둔다.
 * - 통합공공임대: 기준 중위소득 % 기준
 * - 그 외: 전년도 도시근로자 가구원수별 월평균소득 % 기준
 */
export enum SupplyTypeEnum {
  INTEGRATED_PUBLIC = 'INTEGRATED_PUBLIC', // 통합공공임대
  HAPPY_HOUSE = 'HAPPY_HOUSE', // 행복주택
  NATIONAL_RENTAL = 'NATIONAL_RENTAL', // 국민임대
  PUBLIC_RENTAL = 'PUBLIC_RENTAL', // 공공임대
  PERMANENT_RENTAL = 'PERMANENT_RENTAL', // 영구임대
  PURCHASED_RENTAL = 'PURCHASED_RENTAL', // 매입임대
  LONG_TERM_JEONSE = 'LONG_TERM_JEONSE', // 장기전세
  YOUTH_SAFE_HOUSE = 'YOUTH_SAFE_HOUSE', // 청년안심주택
  JEONSE_RENTAL = 'JEONSE_RENTAL', // 전세임대
  NEWLYWED_HOPE_TOWN = 'NEWLYWED_HOPE_TOWN', // 신혼희망타운
  OTHER = 'OTHER',
}
export type SupplyType = keyof typeof SupplyTypeEnum;

import type { NoticeAttachmentSchema } from './notice-attachment.js';

/** 영속 형태. ORM 매핑과 도메인 엔티티 사이의 계약. */
export interface NoticeSchema {
  noticeId: string;
  sourceId: SourceId;
  externalId: string;
  supplyType: SupplyType;
  status: NoticeStatus;
  title: string;
  region: string | null;
  detailUrl: string | null;
  postedAt: Date | null;
  closesAt: Date | null;
  rawJson: Record<string, unknown> | null;
  attachments: NoticeAttachmentSchema[];
}
