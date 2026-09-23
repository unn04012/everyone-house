# apps/web

공공임대 알리미 프론트. Render **Static Site** 로 배포한다.

```bash
npm run dev -w @everyone-house/web     # http://localhost:5173
npm run build -w @everyone-house/web   # dist/
```

## 디자인

`공공임대알리미-handoff` 패키지가 시각 기준이다. `HANDOFF.md` 는 저장소에 올리지 않고 로컬에만 둔다
(`.gitignore`). 아래 규칙표가 그중 코드가 지켜야 할 부분을 옮겨 둔 것이다.

- `src/styles/app.css` — 핸드오프의 디자인 토큰·컴포넌트 **원본 그대로**. 여기서 토큰을 고치지 않는다.
- `src/styles/layout.css` — 핸드오프 HTML 의 page-local 스타일 + 리액트로 옮기며 필요해진 보정.
- `src/styles/theme.css` — 토큰·표면 처리를 덮어쓰는 테마 층. `main.tsx` 의 import 한 줄을 빼면
  핸드오프 원래 모습으로 돌아간다. 색 방향을 바꾸려면 이 파일의 `:root` 만 고치면 된다.

지켜야 할 규칙은 HANDOFF §1 에 있고, 코드에서 그 규칙을 담당하는 자리는 다음과 같다.

| 규칙 | 코드 |
|---|---|
| `모름(null)` ≠ `0원` | `ProfileDraft.stateOf()` · `AmountField` (`data-state`) |
| 판정 3단계 | `VerdictCopy` (도메인 `VerdictEnum` 그대로) |
| 확인 필요는 실패가 아님 | `--color-review` 인디고. 경고색 미사용 |
| 판정에는 항상 사유 | `ReasonCopy` — 사유 코드 11종 → 문구 1:1 |
| 숫자는 사용자 언어로 | `KoreanMoney` (저장 원, 표시 한글 단위) |
| 단정하지 않기 | `VerdictCopy` 문구 ('~해 보여요') |
| 결과엔 항상 원문 출구 | `NoticeCard` 의 `.notice__pdf` (조건 없이 렌더) |

## 구조

```
src/
├─ api/         IApiClient · HttpApiClient · MockApiClient · ApiClientFactory
├─ app/         React context (API 주입 · 프로필 상태)
├─ components/  화면 조각
├─ format/      표시 규칙 (KoreanMoney · VerdictCopy · ReasonCopy · SourceCopy · Josa · Deadline)
├─ pages/       ResultPage · NoticeDetailPage · OnboardingPage · QuestionPage · ProfilePage
├─ profile/     ProfileDraft · QuestionFlow · RegionTable · ProfileStorage
└─ result/      ResultDigest (정렬 · 집계 · 미입력 항목 묶기)
```

- 도메인 타입은 `@everyone-house/domain/types` 에서만 가져온다. 패키지 루트(`.`)는 엔티티까지
  내보내고 엔티티는 `node:crypto` 를 쓰기 때문에 브라우저 번들에 Node 내장 모듈이 섞인다.
- `apps/api` 가 없어서 기본값은 `MockApiClient` 다. `VITE_API_BASE_URL` 을 주면 `HttpApiClient` 로 바뀐다
  (`ApiClientFactory` 한 곳에서만 갈린다).
- 라우팅은 `HashRouter`. 정적 호스팅에 rewrite 설정 없이 돌리기 위해서다.
  알림 메일이 거는 링크는 `/notices/{noticeId}?from=email` 형태이고, 상세 화면이 `from=email` 을 읽어
  '알림 메일에서 열었어요' 를 표기한다.

### 알림 메일은 여기 없다

`email.html` 은 화면이 아니라 발송 템플릿이라 크롤러 쪽에 뒀다 —
`apps/crawler/src/notification/notification-email.template.ts`.
메일 클라이언트 제약(테이블 + 인라인 스타일, CSS 변수·flex·grid 금지) 때문에 `app.css` 토큰을 쓸 수 없어
같은 색 값을 그 클래스의 `static readonly` 로 복제해 뒀다. **토큰을 바꾸면 양쪽을 같이 고쳐야 한다.**
템플릿만 있고 발송은 아직 연결하지 않았다(SPEC: 텔레그램/메일 발송 보류).

### 화면 목록

| 경로 | 화면 | 핸드오프 |
|---|---|---|
| `/` | 오늘의 결과 목록 | `result.html` |
| `/notices/:noticeId` | 공고 상세 (판정 근거·순위·공급·일정·행동) | `detail.html` |
| `/onboarding` | Tier 0 온보딩 | `onboarding.html` |
| `/question/:field` | 항목 하나 수정 (결과 카드 · 프로필에서 진입) | — |
| `/profile` | 프로필 확인·수정 | — |

## 컨벤션 이탈 (CLAUDE.md '전부 클래스로')

React 컴포넌트와 훅은 함수다 — 함수 컴포넌트가 아니면 훅을 쓸 수 없다.
**로직은 전부 클래스**에 두고(`format/` · `profile/` · `result/` · `api/`),
함수는 렌더링 계층(`components/` · `pages/` · context)에만 둔다.

## API 에 필요한 것 (미구현)

`MockApiClient` 가 화면이 기대하는 응답 형태를 고정해 두었다. 도메인의 `JudgeReason` 은
코드와 문구만 갖는데, 화면은 사유에 수치가 필요하다.

- `ReasonDetail { actual, limit, ratio }` — '내 값 / 기준값' 비교와 `BORDERLINE` 미터
- `MISSING_PROFILE_DATA` 의 `field` — 어느 항목을 채워야 하는지 (결과 → 입력 화면 연결)

`LIKELY_ELIGIBLE` 의 통과 항목을 보여주려면 **긍정 사유 코드도 함께** 내려와야 한다.
현재 `ReasonCodeEnum` 에는 무주택 충족에 해당하는 긍정 코드가 없다(`NOT_HOMELESS` 는 미충족).
