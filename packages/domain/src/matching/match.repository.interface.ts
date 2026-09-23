import type { MatchEntity } from './match.entity.js';

export interface IMatchRepository {
  save(entity: MatchEntity): Promise<MatchEntity>;
  saveAll(entities: MatchEntity[]): Promise<MatchEntity[]>;
  findByProfileId(profileId: string): Promise<MatchEntity[]>;
}
