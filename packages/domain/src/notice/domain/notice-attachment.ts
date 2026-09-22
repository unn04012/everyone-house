export interface NoticeAttachmentSchema {
  /** 첨부 순번 (미리보기 URL 의 file_seq) */
  fileSeq: number;
  fileName: string;
  /** Synap 문서 뷰어 미리보기 URL. 항상 존재한다. */
  previewUrl: string;
  /** 원본 파일을 GET 으로 받을 수 있는 URL. POST 로만 받을 수 있으면 null. */
  fileUrl: string | null;
  /**
   * GET URL 이 없는 소스의 다운로드 파라미터 (LH/마이홈은 POST 전용).
   * { url, params } 형태로 두어 나중에 공고문 분석기가 그대로 재현할 수 있게 한다.
   */
  downloadRef: { url: string; params: Record<string, string> } | null;
}

/**
 * 공고 첨부. 공고(NoticeEntity)에 종속된 값 객체다 —
 * 단독으로 조회하지 않고 언제나 공고와 함께 읽는다.
 */
export class NoticeAttachment {
  private readonly _fileSeq: number;
  private readonly _fileName: string;
  private readonly _previewUrl: string;
  private readonly _fileUrl: string | null;
  private readonly _downloadRef: { url: string; params: Record<string, string> } | null;

  get fileSeq() {
    return this._fileSeq;
  }
  get fileName() {
    return this._fileName;
  }
  get previewUrl() {
    return this._previewUrl;
  }
  get fileUrl() {
    return this._fileUrl;
  }
  get downloadRef() {
    return this._downloadRef;
  }

  private constructor(schema: NoticeAttachmentSchema) {
    this._fileSeq = schema.fileSeq;
    this._fileName = schema.fileName;
    this._previewUrl = schema.previewUrl;
    this._fileUrl = schema.fileUrl;
    this._downloadRef = schema.downloadRef;
  }

  public static create(schema: NoticeAttachmentSchema): NoticeAttachment {
    return new NoticeAttachment(schema);
  }

  public static fromSchema(schema: NoticeAttachmentSchema): NoticeAttachment {
    return new NoticeAttachment(schema);
  }

  public getAttachment(): NoticeAttachmentSchema {
    return {
      fileSeq: this._fileSeq,
      fileName: this._fileName,
      previewUrl: this._previewUrl,
      fileUrl: this._fileUrl,
      downloadRef: this._downloadRef,
    };
  }

  public isPdf(): boolean {
    return this._fileName.toLowerCase().endsWith('.pdf');
  }

  /** 알림에 실을 링크. 원본이 있으면 원본, 없으면 미리보기. */
  public bestUrl(): string {
    return this._fileUrl ?? this._previewUrl;
  }
}
