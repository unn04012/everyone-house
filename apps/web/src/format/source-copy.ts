import { SourceIdEnum, SupplyTypeEnum, type SourceId, type SupplyType } from '@everyone-house/domain/types';

interface SourcePresentation {
  label: string;
  className: string;
}

/** 공고 출처·유형 표기. 뱃지 색은 app.css 의 .badge--* 를 쓴다. */
export class SourceCopy {
  private static readonly SOURCES: Record<SourceId, SourcePresentation> = {
    [SourceIdEnum.MYHOME_API]: { label: 'LH', className: 'badge--lh' },
    [SourceIdEnum.SH_PORTAL]: { label: 'SH', className: 'badge--sh' },
    [SourceIdEnum.GH_APPLY]: { label: 'GH', className: 'badge--gh' },
  };

  private static readonly SUPPLY_TYPES: Record<SupplyType, string> = {
    [SupplyTypeEnum.INTEGRATED_PUBLIC]: '통합공공임대',
    [SupplyTypeEnum.HAPPY_HOUSE]: '행복주택',
    [SupplyTypeEnum.NATIONAL_RENTAL]: '국민임대',
    [SupplyTypeEnum.PUBLIC_RENTAL]: '공공임대',
    [SupplyTypeEnum.PERMANENT_RENTAL]: '영구임대',
    [SupplyTypeEnum.PURCHASED_RENTAL]: '매입임대',
    [SupplyTypeEnum.LONG_TERM_JEONSE]: '장기전세',
    [SupplyTypeEnum.YOUTH_SAFE_HOUSE]: '청년안심주택',
    [SupplyTypeEnum.JEONSE_RENTAL]: '전세임대',
    [SupplyTypeEnum.NEWLYWED_HOPE_TOWN]: '신혼희망타운',
    [SupplyTypeEnum.OTHER]: '기타',
  };

  public static of(sourceId: SourceId): SourcePresentation {
    return SourceCopy.SOURCES[sourceId];
  }

  public static supplyTypeLabel(supplyType: SupplyType): string {
    return SourceCopy.SUPPLY_TYPES[supplyType] ?? '기타';
  }
}
