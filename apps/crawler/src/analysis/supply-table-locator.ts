import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SupplyTablePage } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';

const execFileAsync = promisify(execFile);

/**
 * 공고문에서 '임대 대상 및 금액' 표가 있는 페이지를 찾는다.
 *
 * 표를 구조화해 뽑는 대신 페이지를 이미지로 보여주기로 했다 — LLM 을 쓰지 않으니
 * 비용이 0 이고, 원본 그대로라 전사 오류도 없다. 사용자는 공식 문서를 그대로 본다.
 * (구조화하면 한 공고에 100건 넘는 행이 나와 출력 토큰만 1만 개를 넘었다.)
 */
@Injectable()
export class SupplyTableLocator {
  /**
   * 표 제목. 기관마다 표기가 다르다.
   * 본문 서술에도 같은 말이 나오므로(예: "…임대조건은 달라질 수 있습니다")
   * 제목처럼 짧은 줄에서만 인정한다.
   */
  private static readonly HEADINGS = ['임대 대상 및 금액', '공급대상 및 임대조건', '공급호수 및 임대조건', '임대조건 및 임대기간', '임대조건'];
  /** 제목으로 볼 줄 길이 상한. 본문 문장은 이보다 길다. */
  private static readonly MAX_HEADING_LENGTH = 40;
  /** 서술문에 흔한 말. 이게 섞여 있으면 제목이 아니다. */
  private static readonly BODY_MARKERS = ['습니다', '됩니다', '바랍니다', '경우', '따라'];
  /** 오탐을 줄이기 위해 앞부분만 본다 — 공급현황은 보통 공고문 초반에 있다. */
  private static readonly MAX_PAGES = 30;

  private readonly _logger = new Logger(SupplyTableLocator.name);

  public async locate(pdfPath: string): Promise<SupplyTablePage[]> {
    const pageCount = Math.min(await this._pageCount(pdfPath), SupplyTableLocator.MAX_PAGES);
    const found: SupplyTablePage[] = [];

    for (let page = 1; page <= pageCount; page += 1) {
      const heading = this._findHeading(await this._pageText(pdfPath, page));
      if (heading) {
        found.push({ pageNumber: page, heading });
      }
    }

    this._logger.log(found.length === 0 ? '공급표 페이지를 찾지 못했습니다' : `공급표 페이지 ${found.map((p) => p.pageNumber).join(', ')}`);
    return found;
  }

  /** 지정 페이지를 PNG 로 렌더링한다. 파일 경로 접두어를 받아 poppler 가 붙이는 이름을 그대로 쓴다. */
  public async renderPage(pdfPath: string, pageNumber: number, outputPrefix: string, dpi = 150): Promise<void> {
    await execFileAsync('pdftoppm', ['-png', '-r', String(dpi), '-f', String(pageNumber), '-l', String(pageNumber), pdfPath, outputPrefix]);
  }

  private _findHeading(text: string): string | null {
    for (const line of text.split('\n')) {
      const trimmed = line.trim();

      if (trimmed.length > SupplyTableLocator.MAX_HEADING_LENGTH) {
        continue;
      }
      if (SupplyTableLocator.BODY_MARKERS.some((marker) => trimmed.includes(marker))) {
        continue;
      }
      if (SupplyTableLocator.HEADINGS.some((heading) => trimmed.includes(heading))) {
        return trimmed;
      }
    }
    return null;
  }

  private async _pageCount(pdfPath: string): Promise<number> {
    const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
    return Number(/^Pages:\s*(\d+)/m.exec(stdout)?.[1] ?? 0);
  }

  private async _pageText(pdfPath: string, page: number): Promise<string> {
    const { stdout } = await execFileAsync('pdftotext', ['-f', String(page), '-l', String(page), pdfPath, '-']);
    return stdout;
  }
}
