import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ApiClientFactory } from '../api/api-client.factory.js';
import type { IApiClient } from '../api/api.types.js';

const ApiContext = createContext<IApiClient | null>(null);

/** 구현 교체 지점. 테스트는 client 를 직접 주입한다 */
export function ApiProvider({ client, children }: { client?: IApiClient; children: ReactNode }) {
  const value = useMemo(() => client ?? ApiClientFactory.create(), [client]);
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiClient(): IApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error('ApiProvider 안에서만 쓸 수 있어요');
  }
  return client;
}
