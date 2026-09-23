import { createHash } from 'node:crypto';

import { NoticeAttachment } from './notice-attachment.js';
import type { AnalysisStatus, NoticeSchema, NoticeStatus, SourceId, SupplyType } from './notice.types.js';

export class NoticeEntity {
  private readonly _noticeId: string;
  private readonly _sourceId: SourceId;
  private readonly _externalId: string;
  private readonly _supplyType: SupplyType;
  private readonly _title: string;
  private readonly _region: string | null;
  private readonly _detailUrl: string | null;
  private readonly _postedAt: Date | null;
  private readonly _rawJson: Record<string, unknown> | null;

  private _status: NoticeStatus;
  private _closesAt: Date | null;
  private _attachments: NoticeAttachment[];
  private _analysisStatus: AnalysisStatus;
  private _analysisAttempts: number;

  get noticeId() {
    return this._noticeId;
  }
  get sourceId() {
    return this._sourceId;
  }
  get externalId() {
    return this._externalId;
  }
  get supplyType() {
    return this._supplyType;
  }
  get title() {
    return this._title;
  }
  get region() {
    return this._region;
  }
  get detailUrl() {
    return this._detailUrl;
  }
  get postedAt() {
    return this._postedAt;
  }
  get closesAt() {
    return this._closesAt;
  }
  get status() {
    return this._status;
  }
  get rawJson() {
    return this._rawJson;
  }
  get attachments(): readonly NoticeAttachment[] {
    return this._attachments;
  }
  get analysisStatus() {
    return this._analysisStatus;
  }
  get analysisAttempts() {
    return this._analysisAttempts;
  }

  private constructor(schema: NoticeSchema) {
    this._noticeId = schema.noticeId;
    this._sourceId = schema.sourceId;
    this._externalId = schema.externalId;
    this._supplyType = schema.supplyType;
    this._status = schema.status;
    this._title = schema.title;
    this._region = schema.region;
    this._detailUrl = schema.detailUrl;
    this._postedAt = schema.postedAt;
    this._closesAt = schema.closesAt;
    this._rawJson = schema.rawJson;
    this._attachments = schema.attachments.map((attachment) => NoticeAttachment.fromSchema(attachment));
    this._analysisStatus = schema.analysisStatus;
    this._analysisAttempts = schema.analysisAttempts;
  }

  /**
   * 공고 ID 는 (소스, 소스내 공고번호)에서 결정론적으로 만든다.
   *
   * 랜덤 UUID 를 쓰면 재수집 때마다 값이 바뀌어, upsert 가 PK 를 덮어쓰고
   * 이 ID 를 참조하던 notice_criteria·matches 가 고아가 된다.
   * 같은 공고는 몇 번을 수집해도 같은 ID 여야 한다.
   */
  private static _deriveNoticeId(sourceId: SourceId, externalId: string): string {
    const hash = createHash('sha256').update(`${sourceId}:${externalId}`).digest('hex');
    // UUID v8(커스텀) 형태로 맞춘다 — 값 자체가 해시라 버전 비트만 표시용으로 채운다.
    return [hash.slice(0, 8), hash.slice(8, 12), `8${hash.slice(13, 16)}`, `8${hash.slice(17, 20)}`, hash.slice(20, 32)].join('-');
  }

  /**
   * 소스 어댑터가 정규화한 값으로 새 공고를 만든다.
   * `externalId`는 소스 내에서 공고를 고유하게 지목하는 값이어야 한다 (dedupe 키).
   */
  public static create({
    sourceId,
    externalId,
    supplyType,
    status,
    title,
    region,
    detailUrl,
    postedAt,
    closesAt,
    rawJson,
  }: {
    sourceId: SourceId;
    externalId: string;
    supplyType: SupplyType;
    status: NoticeStatus;
    title: string;
    region?: string | null;
    detailUrl?: string | null;
    postedAt?: Date | null;
    closesAt?: Date | null;
    rawJson?: Record<string, unknown> | null;
  }): NoticeEntity {
    return new NoticeEntity({
      noticeId: NoticeEntity._deriveNoticeId(sourceId, externalId),
      sourceId,
      externalId,
      supplyType,
      status,
      title,
      region: region ?? null,
      detailUrl: detailUrl ?? null,
      postedAt: postedAt ?? null,
      closesAt: closesAt ?? null,
      rawJson: rawJson ?? null,
      attachments: [],
      analysisStatus: 'PENDING',
      analysisAttempts: 0,
    });
  }

  public static fromSchema(schema: NoticeSchema): NoticeEntity {
    return new NoticeEntity(schema);
  }

  public getNotice(): NoticeSchema {
    return {
      noticeId: this._noticeId,
      sourceId: this._sourceId,
      externalId: this._externalId,
      supplyType: this._supplyType,
      status: this._status,
      title: this._title,
      region: this._region,
      detailUrl: this._detailUrl,
      postedAt: this._postedAt,
      closesAt: this._closesAt,
      rawJson: this._rawJson,
      attachments: this._attachments.map((attachment) => attachment.getAttachment()),
      analysisStatus: this._analysisStatus,
      analysisAttempts: this._analysisAttempts,
    };
  }

  /** 소스에서 다시 읽은 상태를 반영한다. 마감된 공고는 알림 대상에서 빠진다. */
  public updateStatus(status: NoticeStatus, closesAt?: Date | null) {
    this._status = status;
    if (closesAt !== undefined) {
      this._closesAt = closesAt;
    }
  }

  /** 상세 페이지에서 찾은 첨부를 붙인다. 신규 공고에만 수행한다(상세 요청 1회 추가). */
  public attachDocuments(attachments: NoticeAttachment[]) {
    this._attachments = attachments;
  }

  /** 알림에 실을 공고문. PDF 첨부 중 첫 번째를 대표로 본다. */
  public primaryDocument(): NoticeAttachment | null {
    return this._attachments.find((attachment) => attachment.isPdf()) ?? this._attachments[0] ?? null;
  }

  public isOpen(): boolean {
    return this._status === 'OPEN';
  }
}
