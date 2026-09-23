/**
 * 브라우저에서도 안전한 순수 타입·enum 진입점.
 *
 * `index.ts` 는 엔티티까지 내보내고, 엔티티는 `node:crypto` 를 쓴다 —
 * apps/web 이 그 경로를 끌고 오면 번들러가 Node 내장 모듈을 스텁으로 바꿔 넣는다.
 * 프론트는 이 진입점만 쓴다.
 */
export * from './notice/domain/notice.types.js';
export type { NoticeAttachmentSchema } from './notice/domain/notice-attachment.js';
export * from './profile/domain/profile.types.js';
export type { LocationSchema } from './profile/domain/location.js';
export * from './eligibility/eligibility.types.js';
export * from './criteria/criteria.types.js';
export * from './ranking/ranking.types.js';
export * from './matching/match.types.js';
