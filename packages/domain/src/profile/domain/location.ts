export interface LocationSchema {
  /** 광역시도. 예: '서울특별시', '경기도' */
  province: string;
  /** 시군구. 예: '강남구', '성남시'. 시도만 아는 경우 null */
  district: string | null;
}

/**
 * 순위 판정용 위치. 자치구 단위까지 필요하다 —
 * 행복주택 우선공급은 "행복주택이 위치한 자치구"인지로 1/2순위가 갈린다.
 */
export class Location {
  private readonly _province: string;
  private readonly _district: string | null;

  get province() {
    return this._province;
  }
  get district() {
    return this._district;
  }

  private constructor(schema: LocationSchema) {
    this._province = schema.province;
    this._district = schema.district;
  }

  public static create(province: string, district: string | null = null): Location {
    if (!province.trim()) {
      throw new Error('광역시도는 비워 둘 수 없습니다');
    }
    return new Location({ province: province.trim(), district: district?.trim() || null });
  }

  public static fromSchema(schema: LocationSchema): Location {
    return new Location(schema);
  }

  public getLocation(): LocationSchema {
    return { province: this._province, district: this._district };
  }

  /** 같은 광역시도인가. (예: 행복주택 우선공급 2순위 = 같은 서울시) */
  public isSameProvince(other: Location): boolean {
    return this._province === other._province;
  }

  /** 같은 시군구인가. (예: 행복주택 우선공급 1순위 = 같은 자치구) */
  public isSameDistrict(other: Location): boolean {
    return this.isSameProvince(other) && this._district !== null && this._district === other._district;
  }

  /** 주어진 지역 목록에 포함되는가. 공고문의 순위별 지역 목록과 대조할 때 쓴다. */
  public isIn(provinces: readonly string[]): boolean {
    return provinces.some((name) => this._province === name || (this._district !== null && `${this._province} ${this._district}` === name));
  }

  public toString(): string {
    return this._district ? `${this._province} ${this._district}` : this._province;
  }
}
