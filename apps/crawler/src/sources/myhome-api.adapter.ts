import { NoticeEntity } from '@everyone-house/domain';
import type { NoticeAttachment, NoticeStatus, SourceId, SupplyType } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';
import { MyhomeConfigService } from '../config/myhome/myhome-config.service.js';
import { SourceConfigService } from '../config/source/source-config.service.js';
import { HttpClient } from '../http/http-client.js';
import { MyhomeDetailAdapter } from './myhome-detail.adapter.js';
import type { MyhomeRcritNtcItem, MyhomeRcritNtcResponse } from './myhome-api.types.js';
import type { IAttachmentResolver, ISourceAdapter } from './source.adapter.interface.js';

/**
 * 마이홈포털 모집공고 API (data.go.kr 15108420).
 *
 * 주의점 두 가지:
 *  1) "현재 모집중" 스냅샷만 준다 — 마감분은 사라지므로 주기 폴링이 전제다 (SPEC §3.1)
 *  2) 같은 공고가 단지별(houseSn)로 중복돼 온다. 서울 기준 150행 → 실제 33건.
 *     알림 단위는 공고이므로 pblancId 로 묶는다.
 */
@Injectable()
export class MyhomeApiAdapter implements ISourceAdapter, IAttachmentResolver {
  /** 광역시도 코드: 서울 11, 경기 41 (SPEC §2 스코프) */
  private static readonly REGION_CODES = ['11', '41'];
  private static readonly ROWS_PER_PAGE = 100;

  public readonly sourceId: SourceId = 'MYHOME_API';

  private static readonly SUPPLY_TYPE_BY_LABEL: Record<string, SupplyType> = {
    통합공공임대: 'INTEGRATED_PUBLIC',
    행복주택: 'HAPPY_HOUSE',
    국민임대: 'NATIONAL_RENTAL',
    공공임대: 'PUBLIC_RENTAL',
    영구임대: 'PERMANENT_RENTAL',
    매입임대: 'PURCHASED_RENTAL',
    장기전세: 'LONG_TERM_JEONSE',
    전세임대: 'JEONSE_RENTAL',
    신혼희망타운: 'NEWLYWED_HOPE_TOWN',
  };

  private readonly _logger = new Logger(MyhomeApiAdapter.name);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _myhomeConfig: MyhomeConfigService,
    private readonly _myhomeDetailAdapter: MyhomeDetailAdapter,
    private readonly _sourceConfig: SourceConfigService,
  ) {}

  public async fetchNotices(): Promise<NoticeEntity[]> {
    const items: MyhomeRcritNtcItem[] = [];

    for (const regionCode of MyhomeApiAdapter.REGION_CODES) {
      items.push(...(await this._fetchRegion(regionCode)));
    }

    const notices = this._groupByPblancId(items);
    this._logger.log(`마이홈 API: ${items.length}행 → 공고 ${notices.length}건 (단지 중복 제거)`);
    return notices;
  }

  /** 공고문은 마이홈 상세에 있다. LH 사이트는 robots.txt 가 파일 다운로드를 금지한다. */
  public async resolveAttachments(externalId: string): Promise<NoticeAttachment[]> {
    return await this._myhomeDetailAdapter.fetchAttachments(externalId);
  }

  private async _fetchRegion(regionCode: string): Promise<MyhomeRcritNtcItem[]> {
    const url = this._buildUrl(regionCode);
    const payload = await this._httpClient.fetchJson<MyhomeRcritNtcResponse>(url);
    const { header, body } = payload.response;

    if (header.resultCode !== '00') {
      throw new Error(`마이홈 API 오류 (${header.resultCode}): ${header.resultMsg}`);
    }

    return body.item ?? [];
  }

  private _buildUrl(regionCode: string): string {
    const params = new URLSearchParams({
      serviceKey: this._myhomeConfig.serviceKey,
      numOfRows: String(MyhomeApiAdapter.ROWS_PER_PAGE),
      pageNo: '1',
      _type: 'json',
      brtcCode: regionCode,
    });

    return `${this._sourceConfig.myhomeApiUrl}?${params.toString()}`;
  }

  /** 단지별로 중복된 행을 공고 단위로 합친다. 지역은 단지들의 시군구를 모아 표기한다. */
  public groupByPblancId(items: MyhomeRcritNtcItem[]): NoticeEntity[] {
    return this._groupByPblancId(items);
  }

  private _groupByPblancId(items: MyhomeRcritNtcItem[]): NoticeEntity[] {
    const grouped = new Map<string, MyhomeRcritNtcItem[]>();

    for (const item of items) {
      const siblings = grouped.get(item.pblancId) ?? [];
      siblings.push(item);
      grouped.set(item.pblancId, siblings);
    }

    return [...grouped.values()].map((siblings) => this._toEntity(siblings));
  }

  private _toEntity(siblings: MyhomeRcritNtcItem[]): NoticeEntity {
    const [item] = siblings;
    const regions = [...new Set(siblings.map((sibling) => `${sibling.brtcNm} ${sibling.signguNm}`.trim()))].sort();

    return NoticeEntity.create({
      sourceId: this.sourceId,
      externalId: item.pblancId,
      supplyType: MyhomeApiAdapter.SUPPLY_TYPE_BY_LABEL[item.suplyTyNm] ?? 'OTHER',
      status: this._toStatus(item.endDe),
      title: item.pblancNm,
      region: regions.join(', ').slice(0, 100),
      detailUrl: item.pcUrl || item.url || null,
      postedAt: this._parseDate(item.rcritPblancDe),
      closesAt: this._parseDate(item.endDe),
      rawJson: {
        suplyInsttNm: item.suplyInsttNm,
        suplyTyNm: item.suplyTyNm,
        houseTyNm: item.houseTyNm,
        sttusNm: item.sttusNm,
        beginDe: item.beginDe,
        endDe: item.endDe,
        houseCount: siblings.length,
        regions,
        lhUrl: item.url,
      },
    });
  }

  /**
   * API 는 모집중인 공고만 주지만 endDe 가 지난 항목이 섞여 온다.
   * 마감일이 없으면 단정하지 않고 UNKNOWN 으로 둔다.
   */
  private _toStatus(endDe: string): NoticeStatus {
    const closesAt = this._parseDate(endDe);
    if (!closesAt) {
      return 'UNKNOWN';
    }
    return closesAt.getTime() >= Date.now() ? 'OPEN' : 'CLOSED';
  }

  private _parseDate(yyyymmdd: string): Date | null {
    const matched = /^(\d{4})(\d{2})(\d{2})$/.exec(yyyymmdd?.trim() ?? '');
    return matched ? new Date(`${matched[1]}-${matched[2]}-${matched[3]}T00:00:00Z`) : null;
  }
}
