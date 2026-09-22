import { randomUUID } from 'node:crypto';

import { Location } from './location.js';
import type { ApplicantCategory, MaritalStatus, UserProfileSchema } from './profile.types.js';

export class UserProfileEntity {
  private static readonly MILLIS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

  private readonly _profileId: string;

  private _category: ApplicantCategory;
  private _householdSize: number;
  private _monthlyIncome: number;
  private _totalAssets: number | null;
  private _carValue: number | null;
  private _isHomeless: boolean;
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
  get householdSize() {
    return this._householdSize;
  }
  get monthlyIncome() {
    return this._monthlyIncome;
  }
  get totalAssets() {
    return this._totalAssets;
  }
  get carValue() {
    return this._carValue;
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
    this._householdSize = schema.householdSize;
    this._monthlyIncome = schema.monthlyIncome;
    this._totalAssets = schema.totalAssets;
    this._carValue = schema.carValue;
    this._isHomeless = schema.isHomeless;
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
      householdSize: this._householdSize,
      monthlyIncome: this._monthlyIncome,
      totalAssets: this._totalAssets,
      carValue: this._carValue,
      isHomeless: this._isHomeless,
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
