import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { NoticeAttachment } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';

const execFileAsync = promisify(execFile);

/**
 * 공고문 첨부를 받아 텍스트로 만든다.
 *
 * 수집 단계에서는 링크만 저장하고 바이트는 받지 않는다 — 분석할 때만 필요하고,
 * 공고 수만큼 PDF 를 쌓아둘 이유가 없다.
 *
 * SH 는 GET, LH(마이홈)는 POST 전용이라 두 경로를 모두 지원한다.
 * 텍스트 추출은 pdftotext(poppler)를 쓴다 — 컨테이너에 poppler-utils 가 필요하다.
 */
@Injectable()
export class DocumentLoader {
  private static readonly USER_AGENT = 'everyone-house-notifier/0.1 (personal use; public rental notice checker)';
  private static readonly TIMEOUT_MS = 120_000;

  private readonly _logger = new Logger(DocumentLoader.name);

  /** 공고문으로 볼 첨부를 고른다. PDF 를 우선하고, 없으면 첫 첨부. */
  public selectDocument(attachments: readonly NoticeAttachment[]): NoticeAttachment | null {
    return attachments.find((attachment) => attachment.isPdf()) ?? attachments[0] ?? null;
  }

  public async loadText(attachment: NoticeAttachment): Promise<string> {
    const pdfBytes = await this._download(attachment);
    return await this._extractText(pdfBytes);
  }

  private async _download(attachment: NoticeAttachment): Promise<Buffer> {
    const response = attachment.fileUrl ? await this._get(attachment.fileUrl) : await this._post(attachment);

    if (!response.ok) {
      throw new Error(`첨부 다운로드 실패: HTTP ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async _get(url: string): Promise<Response> {
    return await fetch(url, {
      headers: { 'user-agent': DocumentLoader.USER_AGENT },
      signal: AbortSignal.timeout(DocumentLoader.TIMEOUT_MS),
    });
  }

  private async _post(attachment: NoticeAttachment): Promise<Response> {
    const ref = attachment.downloadRef;
    if (!ref) {
      throw new Error(`첨부에 다운로드 경로가 없습니다: ${attachment.fileName}`);
    }

    return await fetch(ref.url, {
      method: 'POST',
      headers: { 'user-agent': DocumentLoader.USER_AGENT, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(ref.params).toString(),
      signal: AbortSignal.timeout(DocumentLoader.TIMEOUT_MS),
    });
  }

  private async _extractText(pdfBytes: Buffer): Promise<string> {
    const workDir = await mkdtemp(join(tmpdir(), 'eh-notice-'));
    const pdfPath = join(workDir, 'notice.pdf');
    const textPath = join(workDir, 'notice.txt');

    try {
      await writeFile(pdfPath, pdfBytes);
      // -layout: 표 구조를 보존한다. 소득 금액표를 읽으려면 필수다.
      await execFileAsync('pdftotext', ['-layout', pdfPath, textPath]);
      const text = await readFile(textPath, 'utf8');

      if (text.trim().length < 500) {
        throw new Error('추출된 텍스트가 너무 짧습니다 (스캔본이거나 추출 실패)');
      }

      return text;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}
