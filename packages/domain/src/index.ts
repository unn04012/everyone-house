// notice
export { NoticeEntity } from './notice/domain/notice.entity.js';
export { NoticeAttachment } from './notice/domain/notice-attachment.js';
export type { NoticeAttachmentSchema } from './notice/domain/notice-attachment.js';
export * from './notice/domain/notice.types.js';
export type { INoticeRepository } from './notice/repository/notice.repository.interface.js';

// profile
export { UserProfileEntity } from './profile/domain/user-profile.entity.js';
export { Location } from './profile/domain/location.js';
export type { LocationSchema } from './profile/domain/location.js';
export * from './profile/domain/profile.types.js';

// eligibility
export { EligibilityEngine } from './eligibility/eligibility.engine.js';
export * from './eligibility/eligibility.types.js';
export { EligibilityTable2026 } from './eligibility/tables/2026.js';

// criteria (공고문 추출)
export * from './criteria/criteria.types.js';
