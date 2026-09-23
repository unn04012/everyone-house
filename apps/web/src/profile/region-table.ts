/**
 * 거주지 선택지. 순위 판정은 자치구까지 필요하다 (Location 주석 참고).
 * 수도권 외 시도는 자치구 목록을 아직 채우지 않았고, 이 경우 district = null 로 저장한다.
 */
export class RegionTable {
  private static readonly DISTRICTS: Record<string, readonly string[]> = {
    서울특별시: [
      '강남구',
      '강동구',
      '강북구',
      '강서구',
      '관악구',
      '광진구',
      '구로구',
      '금천구',
      '노원구',
      '도봉구',
      '동대문구',
      '동작구',
      '마포구',
      '서대문구',
      '서초구',
      '성동구',
      '성북구',
      '송파구',
      '양천구',
      '영등포구',
      '용산구',
      '은평구',
      '종로구',
      '중구',
      '중랑구',
    ],
    인천광역시: ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
    경기도: [
      '가평군',
      '고양시',
      '과천시',
      '광명시',
      '광주시',
      '구리시',
      '군포시',
      '김포시',
      '남양주시',
      '동두천시',
      '부천시',
      '성남시',
      '수원시',
      '시흥시',
      '안산시',
      '안성시',
      '안양시',
      '양주시',
      '양평군',
      '여주시',
      '연천군',
      '오산시',
      '용인시',
      '의왕시',
      '의정부시',
      '이천시',
      '파주시',
      '평택시',
      '포천시',
      '하남시',
      '화성시',
    ],
  };

  private static readonly PROVINCES: readonly string[] = [
    '서울특별시',
    '경기도',
    '인천광역시',
    '부산광역시',
    '대구광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '강원특별자치도',
    '충청북도',
    '충청남도',
    '전북특별자치도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주특별자치도',
  ];

  public static provinces(): readonly string[] {
    return RegionTable.PROVINCES;
  }

  public static districtsOf(province: string): readonly string[] {
    return RegionTable.DISTRICTS[province] ?? [];
  }

  public static hasDistricts(province: string): boolean {
    return RegionTable.districtsOf(province).length > 0;
  }
}
