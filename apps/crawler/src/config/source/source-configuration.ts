import { registerAs } from '@nestjs/config';

/**
 * 수집 대상 엔드포인트. 공개 저장소에 남기지 않기 위해 코드가 아닌 환경변수로 받는다.
 * 값은 각 기관 공개 페이지/공개 API 문서에서 확인할 수 있다 (docs/sources.local.md 참고).
 */
export default registerAs('source', () => ({
  shListUrl: process.env.SH_LIST_URL,
  shBaseUrl: process.env.SH_BASE_URL,
  shDetailUrlPrefix: process.env.SH_DETAIL_URL_PREFIX,
  myhomeApiUrl: process.env.MYHOME_API_URL,
  myhomeDetailUrlPrefix: process.env.MYHOME_DETAIL_URL_PREFIX,
  myhomeDownloadUrl: process.env.MYHOME_DOWNLOAD_URL,
}));
