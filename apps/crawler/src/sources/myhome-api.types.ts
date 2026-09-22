/** 마이홈포털 공공주택 모집공고 조회 서비스 (data.go.kr 15108420) 응답 형태. */
export interface MyhomeRcritNtcItem {
  pblancId: string;
  houseSn: number;
  sttusNm: string;
  pblancNm: string;
  suplyInsttNm: string;
  houseTyNm: string;
  suplyTyNm: string;
  rcritPblancDe: string;
  przwnerPresnatnDe: string;
  url: string;
  pcUrl: string;
  mobileUrl: string;
  brtcNm: string;
  signguNm: string;
  beginDe: string;
  endDe: string;
  sumSuplyCo: number;
}

export interface MyhomeRcritNtcResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: string;
      numOfRows: string;
      pageNo: string;
      item?: MyhomeRcritNtcItem[];
    };
  };
}
