import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  /** 기본 관심 유형. SPEC §2 스코프(청년·신혼부부 특화)를 따른다. */
  private static readonly DEFAULT_SUPPLY_TYPES = ['HAPPY_HOUSE', 'NATIONAL_RENTAL', 'INTEGRATED_PUBLIC', 'LONG_TERM_JEONSE', 'NEWLYWED_HOPE_TOWN'];
  /** 유형이 OTHER 로 분류돼도 제목에 이 말이 있으면 분석한다. */
  private static readonly DEFAULT_TITLE_KEYWORDS = ['청년', '신혼', '행복주택'];

  constructor(private readonly _configService: ConfigService) {}

  get databaseUrl(): string {
    return this._configService.getOrThrow<string>('app.databaseUrl');
  }

  /**
   * 분석할 공급 유형. 나머지는 SKIPPED 로 보내 LLM 비용을 아낀다 —
   * 상가임대·용지분양까지 공고문을 읽을 이유가 없다.
   */
  get interestedSupplyTypes(): string[] {
    return this._parseList(this._configService.get<string>('app.interestedSupplyTypes'), AppConfigService.DEFAULT_SUPPLY_TYPES);
  }

  get interestedTitleKeywords(): string[] {
    return this._parseList(this._configService.get<string>('app.interestedTitleKeywords'), AppConfigService.DEFAULT_TITLE_KEYWORDS);
  }

  private _parseList(raw: string | undefined, fallback: string[]): string[] {
    const parsed = (raw ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return parsed.length > 0 ? parsed : fallback;
  }
}
