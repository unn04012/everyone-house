import { randomUUID } from 'node:crypto';

import { Location } from './location.js';
import type { ApplicantCategory, ApplicantScope, MaritalStatus, UserProfileSchema } from './profile.types.js';

export class UserProfileEntity {
  private static readonly MILLIS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

  private readonly _profileId: string;

  private _category: ApplicantCategory;
  private _personalIncome: number;
  private _personalAssets: number | null;
  private _householdSize: number;
  private _householdIncome: number;
  private _householdAssets: number | null;
  private _parentsIncome: number | null;
  private _parentsAssets: number | null;
  private _livesWithParents: boolean;
  private _carValue: number | null;
  private _isHomeless: boolean;
  private _isBasicLivingBeneficiary: boolean;
  private _isSecondLowestIncome: boolean;
  private _isSupportedSingleParent: boolean;
  private _age: number;
  private _maritalStatus: MaritalStatus;
  private _isDualIncome: boolean;
  private _childrenBirthDates: Date[];

  private _residence: Location;
  private _districtMovedInAt: Date | null;
  private _incomeSourceLocation: Location | null;
  private _universityLocation: Location | null;
  private _housingSubscriptionPayments: number;

  get profileId() {
    return this._profileId;
  }
  get category() {
    return this._category;
  }
  get personalIncome() {
    return this._personalIncome;
  }
  get personalAssets() {
    return this._personalAssets;
  }
  get householdSize() {
    return this._householdSize;
  }
  get householdIncome() {
    return this._householdIncome;
  }
  get householdAssets() {
    return this._householdAssets;
  }
  get parentsIncome() {
    return this._parentsIncome;
  }
  get parentsAssets() {
    return this._parentsAssets;
  }
  get livesWithParents() {
    return this._livesWithParents;
  }
  get carValue() {
    return this._carValue;
  }
  get isBasicLivingBeneficiary() {
    return this._isBasicLivingBeneficiary;
  }
  get isSecondLowestIncome() {
    return this._isSecondLowestIncome;
  }
  get isSupportedSingleParent() {
    return this._isSupportedSingleParent;
  }
  get isHomeless() {
    return this._isHomeless;
  }
  get age() {
    return this._age;
  }
  get maritalStatus() {
    return this._maritalStatus;
  }
  get isDualIncome() {
    return this._isDualIncome;
  }
  get childrenBirthDates(): readonly Date[] {
    return this._childrenBirthDates;
  }
  get residence() {
    return this._residence;
  }
  get districtMovedInAt() {
    return this._districtMovedInAt;
  }
  get incomeSourceLocation() {
    return this._incomeSourceLocation;
  }
  get universityLocation() {
    return this._universityLocation;
  }
  get housingSubscriptionPayments() {
    return this._housingSubscriptionPayments;
  }

  private constructor(schema: UserProfileSchema) {
    this._profileId = schema.profileId;
    this._category = schema.category;
    this._personalIncome = schema.personalIncome;
    this._personalAssets = schema.personalAssets;
    this._householdSize = schema.householdSize;
    this._householdIncome = schema.householdIncome;
    this._householdAssets = schema.householdAssets;
    this._parentsIncome = schema.parentsIncome;
    this._parentsAssets = schema.parentsAssets;
    this._livesWithParents = schema.livesWithParents;
    this._carValue = schema.carValue;
    this._isHomeless = schema.isHomeless;
    this._isBasicLivingBeneficiary = schema.isBasicLivingBeneficiary;
    this._isSecondLowestIncome = schema.isSecondLowestIncome;
    this._isSupportedSingleParent = schema.isSupportedSingleParent;
    this._age = schema.age;
    this._maritalStatus = schema.maritalStatus;
    this._isDualIncome = schema.isDualIncome;
    this._childrenBirthDates = schema.childrenBirthDates.map((date) => new Date(date));
    this._residence = Location.fromSchema(schema.residence);
    this._districtMovedInAt = schema.districtMovedInAt ? new Date(schema.districtMovedInAt) : null;
    this._incomeSourceLocation = schema.incomeSourceLocation ? Location.fromSchema(schema.incomeSourceLocation) : null;
    this._universityLocation = schema.universityLocation ? Location.fromSchema(schema.universityLocation) : null;
    this._housingSubscriptionPayments = schema.housingSubscriptionPayments;
  }

  public static create(input: Omit<UserProfileSchema, 'profileId'>): UserProfileEntity {
    if (input.householdSize < 1) {
      throw new Error('가구원수는 1 이상이어야 합니다');
    }
    if (input.housingSubscriptionPayments < 0) {
      throw new Error('청약저축 납입회차는 0 이상이어야 합니다');
    }
    return new UserProfileEntity({ ...input, profileId: randomUUID() });
  }

  public static fromSchema(schema: UserProfileSchema): UserProfileEntity {
    return new UserProfileEntity(schema);
  }

  public getProfile(): UserProfileSchema {
    return {
      profileId: this._profileId,
      category: this._category,
      personalIncome: this._personalIncome,
      personalAssets: this._personalAssets,
      householdSize: this._householdSize,
      householdIncome: this._householdIncome,
      householdAssets: this._householdAssets,
      parentsIncome: this._parentsIncome,
      parentsAssets: this._parentsAssets,
      livesWithParents: this._livesWithParents,
      carValue: this._carValue,
      isHomeless: this._isHomeless,
      isBasicLivingBeneficiary: this._isBasicLivingBeneficiary,
      isSecondLowestIncome: this._isSecondLowestIncome,
      isSupportedSingleParent: this._isSupportedSingleParent,
      age: this._age,
      maritalStatus: this._maritalStatus,
      isDualIncome: this._isDualIncome,
      childrenBirthDates: this._childrenBirthDates.map((date) => date.toISOString()),
      residence: this._residence.getLocation(),
      districtMovedInAt: this._districtMovedInAt?.toISOString() ?? null,
      incomeSourceLocation: this._incomeSourceLocation?.getLocation() ?? null,
      universityLocation: this._universityLocation?.getLocation() ?? null,
      housingSubscriptionPayments: this._housingSubscriptionPayments,
    };
  }

  /**
   * 공고가 요구하는 범위의 소득·자산을 돌려준다.
   *
   * 같은 사람이라도 공고마다 적용 범위가 다르다 — 본인만 보면 1인 가구 기준과,
   * 세대 전원을 보면 해당 가구원수 기준과 비교해야 한다.
   * 필요한 값이 없으면 null 을 돌려주고, 판정은 NEEDS_REVIEW 로 간다.
   */
  public resolveScope(scope: ApplicantScope): { income: number; assets: number | null; householdSize: number } | null {
    switch (scope) {
      case 'SELF':
        return { income: this._personalIncome, assets: this._personalAssets, householdSize: 1 };

      case 'HOUSEHOLD':
        return { income: this._householdIncome, assets: this._householdAssets, householdSize: this._householdSize };

      case 'SELF_AND_PARENTS': {
        if (this._parentsIncome === null) {
          return null;
        }
        const assets = this._personalAssets === null || this._parentsAssets === null ? null : this._personalAssets + this._parentsAssets;
        // 본인+부모의 가구원수는 별도로 묻지 않는다. 세대 가구원수로 근사한다.
        return { income: this._personalIncome + this._parentsIncome, assets, householdSize: this._householdSize };
      }

      case 'SELF_IF_NOT_HOUSEHOLDER':
        return this._livesWithParents ? this.resolveScope('SELF') : this.resolveScope('HOUSEHOLD');

      default:
        return null;
    }
  }

  /** 수급자·차상위·한부모 중 하나라도 해당하는가. 매입·전세임대 우선공급 1순위 조건이다. */
  public hasPrioritySupportStatus(): boolean {
    return this._isBasicLivingBeneficiary || this._isSecondLowestIncome || this._isSupportedSingleParent;
  }

  /**
   * 순위 판정에 쓸 수 있는 위치들.
   * 공고는 보통 "거주지 또는 소득근거지"(대학생은 대학 소재지)를 기준으로 순위를 매긴다.
   */
  public rankingLocations(): Location[] {
    const locations = [this._residence];

    if (this._category === 'UNIVERSITY_STUDENT' && this._universityLocation) {
      locations.push(this._universityLocation);
    }
    if (this._incomeSourceLocation) {
      locations.push(this._incomeSourceLocation);
    }

    return locations;
  }

  /** 우선공급 최우선 조건: 2세 미만 자녀가 있는가. 기준일은 공고일이다. */
  public hasChildUnderTwo(asOf: Date): boolean {
    return this._childrenBirthDates.some((birthDate) => this._yearsBetween(birthDate, asOf) < 2);
  }

  /**
   * 기준일 이후 출생 자녀 수. 소득 가산 판정에 쓴다.
   * 기준일이 공고마다 다르므로 인자로 받는다.
   */
  public childrenBornAfter(cutoff: Date): number {
    return this._childrenBirthDates.filter((birthDate) => birthDate.getTime() >= cutoff.getTime()).length;
  }

  /** 해당 자치구 거주 연수. 배점(3년 이상/미만) 판정에 쓴다. 전입일을 모르면 null. */
  public residencyYearsInDistrict(asOf: Date): number | null {
    return this._districtMovedInAt === null ? null : this._yearsBetween(this._districtMovedInAt, asOf);
  }

  /** 청약저축 납입회차가 기준 이상인가. (국민임대 24회/6회, 장기전세 동일) */
  public meetsSubscriptionPayments(required: number): boolean {
    return this._housingSubscriptionPayments >= required;
  }

  private _yearsBetween(from: Date, to: Date): number {
    return (to.getTime() - from.getTime()) / UserProfileEntity.MILLIS_PER_YEAR;
  }
}
