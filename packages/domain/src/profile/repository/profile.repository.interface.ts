import type { UserProfileEntity } from '../domain/user-profile.entity.js';

export interface IProfileRepository {
  findAll(): Promise<UserProfileEntity[]>;
  findById(profileId: string): Promise<UserProfileEntity | null>;
  save(entity: UserProfileEntity): Promise<UserProfileEntity>;
}
