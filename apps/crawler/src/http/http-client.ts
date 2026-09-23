import { Injectable, Logger } from '@nestjs/common';

/** 공공기관 서버에 예의를 지킨다 (SPEC §9): UA 명시, 저빈도, 실패 시 지수 백오프. */
@Injectable()
export class HttpClient {
  private static readonly USER_AGENT = 'everyone-house-notifier/0.1 (personal use; public rental notice checker)';
  private static readonly TIMEOUT_MS = 20_000;
  private static readonly MAX_ATTEMPTS = 3;

  private readonly _logger = new Logger(HttpClient.name);

  public async fetchHtml(url: string): Promise<string> {
    return await this._withRetry(url, async () => {
      const response = await fetch(url, {
        headers: { 'user-agent': HttpClient.USER_AGENT, accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(HttpClient.TIMEOUT_MS),
      });
      this._assertOk(response);
      return await response.text();
    });
  }

  /** 폼 POST 로 HTML 을 받는다. GH 는 목록 페이지네이션·상세가 모두 POST 다. */
  public async postHtml(url: string, params: Record<string, string>): Promise<string> {
    return await this._withRetry(url, async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'user-agent': HttpClient.USER_AGENT,
          accept: 'text/html,application/xhtml+xml',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
        signal: AbortSignal.timeout(HttpClient.TIMEOUT_MS),
      });
      this._assertOk(response);
      return await response.text();
    });
  }

  public async fetchJson<T>(url: string): Promise<T> {
    return await this._withRetry(url, async () => {
      const response = await fetch(url, {
        headers: { 'user-agent': HttpClient.USER_AGENT, accept: 'application/json' },
        signal: AbortSignal.timeout(HttpClient.TIMEOUT_MS),
      });
      this._assertOk(response);

      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        // 공공데이터포털은 키 오류 등을 JSON 이 아닌 XML 로 돌려준다.
        throw new Error(`JSON 응답이 아닙니다: ${text.slice(0, 200)}`);
      }
    });
  }

  /**
   * 리다이렉트를 따라가지 않고 Location 만 읽는다.
   * 본문을 받지 않으므로 대상 서버에 부담을 주지 않는다.
   */
  public async resolveRedirect(url: string): Promise<string | null> {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': HttpClient.USER_AGENT },
      signal: AbortSignal.timeout(HttpClient.TIMEOUT_MS),
    });

    return response.headers.get('location');
  }

  private async _withRetry<T>(url: string, request: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= HttpClient.MAX_ATTEMPTS; attempt += 1) {
      try {
        return await request();
      } catch (error) {
        lastError = error;
        if (attempt < HttpClient.MAX_ATTEMPTS) {
          const backoffMs = 1000 * 2 ** (attempt - 1);
          this._logger.warn(`${url} 요청 실패 (${attempt}/${HttpClient.MAX_ATTEMPTS}), ${backoffMs}ms 후 재시도: ${String(error)}`);
          await this._sleep(backoffMs);
        }
      }
    }

    throw new Error(`${url} 요청이 ${HttpClient.MAX_ATTEMPTS}회 모두 실패했습니다: ${String(lastError)}`);
  }

  private _assertOk(response: Response): void {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
