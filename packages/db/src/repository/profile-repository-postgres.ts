import { UserProfileEntity } from '@everyone-house/domain';
import type { IProfileRepository, UserProfileSchema } from '@everyone-house/domain';
import type { DataSource, Repository } from 'typeorm';
import { UserProfileOrmEntity } from '../schema/user-profile.orm-entity.js';

export class ProfileRepositoryPostgres implements IProfileRepository {
  private readonly _repository: Repository<UserProfileOrmEntity>;

  constructor(dataSource: DataSource) {
    this._repository = dataSource.getRepository(UserProfileOrmEntity);
  }

  public async findAll(): Promise<UserProfileEntity[]> {
    const rows = await this._repository.find();
    return rows.map((row) => this._mapRowToEntity(row));
  }

  public async findById(profileId: string): Promise<UserProfileEntity | null> {
    const row = await this._repository.findOneBy({ profileId });
    return row ? this._mapRowToEntity(row) : null;
  }

  public async save(entity: UserProfileEntity): Promise<UserProfileEntity> {
    const profile = entity.getProfile();
    await this._repository.save({
      profileId: profile.profileId,
      category: profile.category,
      personalIncome: profile.personalIncome,
      personalAssets: profile.personalAssets,
      householdSize: profile.householdSize,
      householdIncome: profile.householdIncome,
      householdAssets: profile.householdAssets,
      parentsIncome: profile.parentsIncome,
      parentsAssets: profile.parentsAssets,
      parentsCount: profile.parentsCount,
      livesWithParents: profile.livesWithParents,
      carValue: profile.carValue,
      isHomeless: profile.isHomeless,
      age: profile.age,
      maritalStatus: profile.maritalStatus,
      isDualIncome: profile.isDualIncome,
      childrenBirthDates: profile.childrenBirthDates,
      isBasicLivingBeneficiary: profile.isBasicLivingBeneficiary,
      isSecondLowestIncome: profile.isSecondLowestIncome,
      isSupportedSingleParent: profile.isSupportedSingleParent,
      residenceProvince: profile.residence.province,
      residenceDistrict: profile.residence.district,
      districtMovedInAt: profile.districtMovedInAt === null ? null : new Date(profile.districtMovedInAt),
      incomeSourceProvince: profile.incomeSourceLocation?.province ?? null,
      incomeSourceDistrict: profile.incomeSourceLocation?.district ?? null,
      universityProvince: profile.universityLocation?.province ?? null,
      universityDistrict: profile.universityLocation?.district ?? null,
      housingSubscriptionPayments: profile.housingSubscriptionPayments,
    });

    return entity;
  }

  private _mapRowToEntity(row: UserProfileOrmEntity): UserProfileEntity {
    const schema: UserProfileSchema = {
      profileId: row.profileId,
      category: row.category,
      personalIncome: row.personalIncome,
      personalAssets: row.personalAssets,
      householdSize: row.householdSize,
      householdIncome: row.householdIncome,
      householdAssets: row.householdAssets,
      parentsIncome: row.parentsIncome,
      parentsAssets: row.parentsAssets,
      parentsCount: row.parentsCount,
      livesWithParents: row.livesWithParents,
      carValue: row.carValue,
      isHomeless: row.isHomeless,
      age: row.age,
      maritalStatus: row.maritalStatus,
      isDualIncome: row.isDualIncome,
      childrenBirthDates: (row.childrenBirthDates as string[] | null) ?? [],
      isBasicLivingBeneficiary: row.isBasicLivingBeneficiary,
      isSecondLowestIncome: row.isSecondLowestIncome,
      isSupportedSingleParent: row.isSupportedSingleParent,
      residence: { province: row.residenceProvince, district: row.residenceDistrict },
      districtMovedInAt: row.districtMovedInAt?.toISOString() ?? null,
      incomeSourceLocation: row.incomeSourceProvince === null ? null : { province: row.incomeSourceProvince, district: row.incomeSourceDistrict },
      universityLocation: row.universityProvince === null ? null : { province: row.universityProvince, district: row.universityDistrict },
      housingSubscriptionPayments: row.housingSubscriptionPayments,
    };

    return UserProfileEntity.fromSchema(schema);
  }
}
