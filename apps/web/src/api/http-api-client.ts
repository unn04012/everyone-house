import type { ProfileDraftValues } from '../profile/profile-draft.js';
import type { IApiClient, NoticeDetailView, ResultsResponse, SaveProfileResponse } from './api.types.js';

/** apps/api 를 호출하는 구현. 주소는 ApiClientFactory 가 주입한다. */
export class HttpApiClient implements IApiClient {
  private readonly _baseUrl: string;

  public constructor(baseUrl: string) {
    this._baseUrl = baseUrl.replace(/\/$/, '');
  }

  public async fetchResults(values: ProfileDraftValues): Promise<ResultsResponse> {
    return this._post<ResultsResponse>('/results', values);
  }

  public async fetchNoticeDetail(noticeId: string, values: ProfileDraftValues): Promise<NoticeDetailView> {
    return this._post<NoticeDetailView>(`/notices/${encodeURIComponent(noticeId)}`, values);
  }

  public async saveProfile(values: ProfileDraftValues): Promise<SaveProfileResponse> {
    return this._post<SaveProfileResponse>('/profiles', values);
  }

  public async setReminder(noticeId: string, enabled: boolean): Promise<void> {
    await this._post(`/notices/${encodeURIComponent(noticeId)}/reminder`, { enabled });
  }

  private async _post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`요청에 실패했어요 (${response.status})`);
    }
    return (await response.json()) as T;
  }
}
