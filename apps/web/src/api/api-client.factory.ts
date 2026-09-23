import type { IApiClient } from './api.types.js';
import { HttpApiClient } from './http-api-client.js';
import { MockApiClient } from './mock-api-client.js';

/**
 * 구현 선택은 여기 한 곳에서만 한다.
 * `import.meta.env` 직접 접근도 이 클래스 밖으로 새지 않게 막는다 (CLAUDE.md config 규칙의 프론트판).
 */
export class ApiClientFactory {
  public static create(): IApiClient {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    return baseUrl ? new HttpApiClient(baseUrl) : new MockApiClient();
  }
}
