import { VerdictEnum, type Verdict } from '@everyone-house/domain';
import type { NotificationDigest, NotificationItem } from './notification.types.js';

interface VerdictStyle {
  label: string;
  color: string;
  tint: string;
}

/**
 * 알림 메일 템플릿 (HANDOFF §8).
 *
 * 메일 클라이언트(Gmail·Outlook·네이버·Apple Mail) 제약을 그대로 따른다:
 * **테이블 레이아웃 + 인라인 스타일만.** CSS 변수·flex·grid·외부 CSS·웹폰트 금지.
 * 그래서 app.css 의 토큰을 쓸 수 없고 색을 하드코딩한다 — 값은 토큰과 같아야 한다.
 */
export class NotificationEmailTemplate {
  // app.css 토큰과 같은 값. 메일에서는 var() 를 쓸 수 없어 여기에 복제한다
  private static readonly INK = '#15212E';
  private static readonly MUTED = '#5A6472';
  private static readonly LINE = '#E4E6DF';
  private static readonly PAPER = '#FFFFFF';
  private static readonly GROUND = '#ECEEE8';
  private static readonly PRIMARY = '#1E5E88';
  private static readonly PRIMARY_DARK = '#153F58';
  private static readonly REVIEW = '#4E5FA6';
  private static readonly REVIEW_TINT = '#ECEEF9';
  private static readonly REVIEW_INK = '#3A4890';
  private static readonly OK = '#2C7A57';
  private static readonly OK_TINT = '#E6F1EC';
  private static readonly NO = '#8A929E';
  private static readonly NO_TINT = '#EAEBE6';
  /** 메일에서는 웹폰트가 불안정하다 — 시스템 한글 폰트로 */
  private static readonly FONT = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";

  private static readonly VERDICTS: Record<Verdict, VerdictStyle> = {
    [VerdictEnum.LIKELY_ELIGIBLE]: { label: '신청 가능해 보여요', color: NotificationEmailTemplate.OK, tint: NotificationEmailTemplate.OK_TINT },
    [VerdictEnum.NEEDS_REVIEW]: { label: '확인이 필요해요', color: NotificationEmailTemplate.REVIEW, tint: NotificationEmailTemplate.REVIEW_TINT },
    [VerdictEnum.NOT_ELIGIBLE]: { label: '조건에 안 맞아요', color: NotificationEmailTemplate.NO, tint: NotificationEmailTemplate.NO_TINT },
  };

  /** 메일 제목. 단정하지 않고 건수만 알린다 */
  public subject(digest: NotificationDigest): string {
    return `[공공임대 알리미] 새 공고 ${digest.items.length}건`;
  }

  /** 받은편지함 미리보기 텍스트 */
  public preheader(digest: NotificationDigest): string {
    const counts = this._counts(digest.items);
    const head = `신청 가능 ${counts.ok} · 확인 필요 ${counts.review}`;
    return digest.fixableFieldLabel ? `${head} — ${digest.fixableFieldLabel}만 알려주시면 ${digest.fixableCount}건이 확정돼요.` : head;
  }

  public render(digest: NotificationDigest): string {
    const counts = this._counts(digest.items);
    const baseUrl = digest.baseUrl.replace(/\/$/, '');

    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${this._escape(this.subject(digest))}</title>
</head>
<body style="margin:0;padding:0;background:${NotificationEmailTemplate.GROUND};">
<div style="display:none;max-height:0;overflow:hidden;">${this._escape(this.preheader(digest))}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NotificationEmailTemplate.GROUND};">
<tr><td align="center" style="padding:24px 12px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${NotificationEmailTemplate.PAPER};border:1px solid ${NotificationEmailTemplate.LINE};border-radius:16px;font-family:${NotificationEmailTemplate.FONT};color:${NotificationEmailTemplate.INK};">

    <tr><td style="background:${NotificationEmailTemplate.PRIMARY_DARK};padding:18px 24px;border-radius:16px 16px 0 0;font-size:15px;font-weight:700;color:#FFFFFF;">공공임대 알리미</td></tr>

    <tr><td style="padding:24px 24px 8px;">
      <div style="font-size:21px;font-weight:700;line-height:1.4;margin:0 0 8px;">오늘 내 조건으로 본 새 공고 ${digest.items.length}건이에요</div>
      <div style="font-size:14px;color:${NotificationEmailTemplate.MUTED};line-height:1.6;margin:0 0 16px;">${this._escape(digest.profileSummary)} 기준으로 판정했어요.</div>
      <span style="display:inline-block;padding:5px 11px;border-radius:100px;background:${NotificationEmailTemplate.OK_TINT};color:${NotificationEmailTemplate.OK};font-size:12.5px;font-weight:700;">신청 가능 ${counts.ok}</span>
      <span style="display:inline-block;padding:5px 11px;border-radius:100px;background:${NotificationEmailTemplate.REVIEW_TINT};color:${NotificationEmailTemplate.REVIEW};font-size:12.5px;font-weight:700;">확인 필요 ${counts.review}</span>
    </td></tr>

${digest.items.map((item) => this._renderItem(item, baseUrl)).join('\n')}

${this._renderNudge(digest, baseUrl)}
    <tr><td style="padding:16px 24px 20px;background:#FAFBF9;border-top:1px solid ${NotificationEmailTemplate.LINE};border-radius:0 0 16px 16px;font-size:12px;color:${NotificationEmailTemplate.MUTED};line-height:1.6;">
      자동 판정은 1차 필터예요. 최종 자격은 각 공고문 원문으로 확인해 주세요. · ${digest.rulesetYear}년 기준표<br>
      <a href="${this._escape(baseUrl)}/settings/alerts" style="color:${NotificationEmailTemplate.PRIMARY};">알림 설정</a> ·
      <a href="${this._escape(digest.unsubscribeUrl)}" style="color:${NotificationEmailTemplate.PRIMARY};">수신 해지</a>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
  }

  /** 공고 한 건. 카드 전체가 상세로 가는 링크다 */
  private _renderItem(item: NotificationItem, baseUrl: string): string {
    const verdict = NotificationEmailTemplate.VERDICTS[item.verdict];
    const badgeColor = item.verdict === VerdictEnum.LIKELY_ELIGIBLE ? NotificationEmailTemplate.OK : NotificationEmailTemplate.PRIMARY;
    const href = `${baseUrl}/notices/${encodeURIComponent(item.noticeId)}?from=email`;

    return `    <tr><td style="padding:10px 24px 0;">
      <a href="${this._escape(href)}" style="display:block;text-decoration:none;color:${NotificationEmailTemplate.INK};border:1px solid ${NotificationEmailTemplate.LINE};border-radius:14px;padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:12.5px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:6px;background:${badgeColor};color:#FFFFFF;font-weight:700;font-size:11.5px;">${this._escape(item.agencyLabel)}</span>
            &nbsp;<span style="color:${verdict.color};font-weight:700;">${verdict.label}</span>
          </td>
          <td align="right" style="font-size:12.5px;color:${NotificationEmailTemplate.MUTED};font-weight:600;">${this._escape(item.deadlineLabel ?? '')}</td>
        </tr></table>
        <div style="font-size:16px;font-weight:700;line-height:1.45;margin:8px 0 6px;">${this._escape(item.title)}</div>
        <div style="font-size:13px;color:${NotificationEmailTemplate.MUTED};line-height:1.5;margin:0 0 10px;">${this._escape(item.reasonLine)}</div>
        <div style="font-size:13.5px;font-weight:700;color:${NotificationEmailTemplate.PRIMARY};">판정 근거 자세히 보기 →</div>
      </a>
    </td></tr>`;
  }

  /** 미입력 항목 집계 유도. 채울 게 없으면 아예 넣지 않는다 */
  private _renderNudge(digest: NotificationDigest, baseUrl: string): string {
    if (!digest.fixableFieldLabel || digest.fixableCount === 0) {
      return '';
    }
    return `    <tr><td style="padding:16px 24px 24px;">
      <div style="background:${NotificationEmailTemplate.REVIEW_TINT};border-radius:12px;padding:13px 15px;font-size:13px;color:${NotificationEmailTemplate.REVIEW_INK};line-height:1.5;font-weight:600;">
        ${this._escape(digest.fixableFieldLabel)}만 알려주시면 확인 필요 ${digest.fixableCount}건이 확정돼요.
        <a href="${this._escape(baseUrl)}/profile" style="color:${NotificationEmailTemplate.REVIEW};text-decoration:underline;">프로필 채우기</a>
      </div>
    </td></tr>

`;
  }

  private _counts(items: NotificationItem[]): { ok: number; review: number } {
    return {
      ok: items.filter((item) => item.verdict === VerdictEnum.LIKELY_ELIGIBLE).length,
      review: items.filter((item) => item.verdict === VerdictEnum.NEEDS_REVIEW).length,
    };
  }

  /** 공고 제목은 크롤링한 값이라 그대로 넣지 않는다 */
  private _escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
