import { ApplicantCategoryEnum, MaritalStatusEnum } from '@everyone-house/domain';
import type { ApplicantCategory, MaritalStatus } from '@everyone-house/domain';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** 원 단위 금액은 bigint 로 두고 드라이버가 주는 문자열을 number 로 되돌린다. */
const wonTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'user_profiles' })
export class UserProfileOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  @Column({ type: 'enum', enum: ApplicantCategoryEnum })
  category!: ApplicantCategory;

  // ── 본인 기준 ──
  @Column({ type: 'bigint', name: 'personal_income', transformer: wonTransformer })
  personalIncome!: number;

  /** null 은 '미입력'이다. 0 으로 저장하면 자산 초과자를 통과시킨다. */
  @Column({ type: 'bigint', name: 'personal_assets', nullable: true, transformer: wonTransformer })
  personalAssets!: number | null;

  // ── 세대 기준 ──
  @Column({ type: 'int', name: 'household_size' })
  householdSize!: number;

  @Column({ type: 'bigint', name: 'household_income', transformer: wonTransformer })
  householdIncome!: number;

  @Column({ type: 'bigint', name: 'household_assets', nullable: true, transformer: wonTransformer })
  householdAssets!: number | null;

  @Column({ type: 'bigint', name: 'parents_income', nullable: true, transformer: wonTransformer })
  parentsIncome!: number | null;

  @Column({ type: 'bigint', name: 'parents_assets', nullable: true, transformer: wonTransformer })
  parentsAssets!: number | null;

  /** 소득·자산 산정에 포함되는 부모 인원수. '본인과 부모' 범위의 가구원수는 1 + 이 값이다 */
  @Column({ type: 'int', name: 'parents_count', default: 2 })
  parentsCount!: number;

  /** 부모와 같은 세대인가(= 세대주가 아닌가). 청년 계층 판정을 가른다 */
  @Column({ type: 'boolean', name: 'lives_with_parents', default: false })
  livesWithParents!: boolean;

  @Column({ type: 'bigint', name: 'car_value', nullable: true, transformer: wonTransformer })
  carValue!: number | null;

  @Column({ type: 'boolean', name: 'is_homeless' })
  isHomeless!: boolean;

  // ── 우선공급 1순위 조건 ──
  @Column({ type: 'boolean', name: 'is_basic_living_beneficiary', default: false })
  isBasicLivingBeneficiary!: boolean;

  @Column({ type: 'boolean', name: 'is_second_lowest_income', default: false })
  isSecondLowestIncome!: boolean;

  @Column({ type: 'boolean', name: 'is_supported_single_parent', default: false })
  isSupportedSingleParent!: boolean;

  @Column({ type: 'int' })
  age!: number;

  @Column({ type: 'enum', enum: MaritalStatusEnum, name: 'marital_status' })
  maritalStatus!: MaritalStatus;

  @Column({ type: 'boolean', name: 'is_dual_income', default: false })
  isDualIncome!: boolean;

  /** ISO 날짜 문자열 배열. 기준일이 공고마다 달라 날짜 자체를 보관한다. */
  @Column({ type: 'jsonb', name: 'children_birth_dates', default: () => "'[]'::jsonb" })
  childrenBirthDates!: unknown;

  // ── 순위 판정 ──
  @Column({ type: 'varchar', length: 50, name: 'residence_province' })
  residenceProvince!: string;

  /** 자치구. 행복주택 우선공급 1/2순위가 여기서 갈린다. */
  @Column({ type: 'varchar', length: 50, name: 'residence_district', nullable: true })
  residenceDistrict!: string | null;

  @Column({ type: 'timestamptz', name: 'district_moved_in_at', nullable: true })
  districtMovedInAt!: Date | null;

  @Column({ type: 'varchar', length: 50, name: 'income_source_province', nullable: true })
  incomeSourceProvince!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'income_source_district', nullable: true })
  incomeSourceDistrict!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'university_province', nullable: true })
  universityProvince!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'university_district', nullable: true })
  universityDistrict!: string | null;

  /** 주택청약종합저축 납입회차. 국민임대·장기전세 순위의 핵심. */
  @Column({ type: 'int', name: 'housing_subscription_payments', default: 0 })
  housingSubscriptionPayments!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
