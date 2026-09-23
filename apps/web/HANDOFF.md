# 공공임대 알리미 — 프론트 핸드오프

개인용 도구입니다. 알림이 본체이고 화면은 보조예요. 회원가입·요금제·마케팅 랜딩은 없습니다. 화면이 하는 일은 셋 — **프로필 입력 / 판정 근거 확인 / 프로필 수정**.

- **시각 기준(source of truth):** 디자인 캔버스 → https://claude.ai/artifact/FoYp211ksDGvXbAmgjwoYd
  캔버스의 `*.dc.html`은 캔버스 전용 포맷이라 그대로 쓰지 마세요. 실제 코드는 이 폴더 기준입니다.
- **이 패키지**
  - `app.css` — 디자인 토큰(CSS 변수) + 컴포넌트. 모바일 퍼스트, 하단 `@media (min-width:768px)`에 데스크톱 override.
  - `onboarding.html` — 온보딩 질문 화면(월소득). 금액 컴포넌트·정의 도움말 동작 JS 포함.
  - `result.html` — 결과 화면(3단계 판정 카드 + 사이드 rail). 반응형.
  - `detail.html` — 공고 상세(판정 근거·순위·공급·일정 + 행동 영역). 반응형. 이메일에서 진입.
  - `email.html` — 알림 이메일 템플릿(묶음). **메일 클라이언트용** — 테이블 + 인라인 스타일.

---

## 1. 이 제품에서 반드시 지켜야 할 규칙

1. **`모름(null)` ≠ `0원`.** 금액 항목의 빈 값을 0으로 저장하면 자격 없는 사람에게 "적합"이 나갑니다. `잘 모르겠어요`는 `null`로 저장하고, `0원`은 유효한 값(예: 무차량)으로 저장. 두 상태를 화면 어디서도 같게 그리지 마세요. (`onboarding.html`의 `data-state = value|zero|unknown` 참고)
2. **판정은 3단계.** `LIKELY_ELIGIBLE / NEEDS_REVIEW / NOT_ELIGIBLE`. 2단계(적합/미해당)가 아닙니다.
3. **"확인 필요"는 실패가 아니다.** 경고 노랑·빨강 금지. 중성 인디고(`--color-review:#4E5FA6`)를 씁니다. 가장 흔한 결과예요.
4. **판정에는 항상 사유.** 뱃지만 단독으로 뜨는 카드는 없습니다. 엔진이 사유 코드를 함께 내보내고, 코드마다 사람이 읽는 문구가 1:1 매핑(§4).
5. **숫자는 사용자 언어로.** 저장은 원(정수), 표시는 항상 한글 단위 — `3,000,000원`이 아니라 `월 300만원`. 입력 중에도 실시간 에코(자릿수 오입 방지의 핵심). `koreanMoney()` 참고.
6. **단정하지 않기.** "신청 가능합니다"가 아니라 "신청 가능해 보여요". 자동 판정은 1차 필터일 뿐입니다.
7. **결과엔 항상 원문 출구.** 모든 결과 카드에 공고문/PDF 링크(`.notice__pdf`)를 노출. 최종 확인은 사용자가 원문으로 합니다.

---

## 2. 디자인 토큰 (`app.css` `:root`)

| 그룹 | 변수 | 값 |
|---|---|---|
| 배경 | `--color-ground` / `--color-paper` | `#F4F5F1` / `#FFFFFF` |
| 텍스트 | `--color-ink` / `--color-muted` / `--color-faint` | `#15212E` / `#5A6472` / `#8A929E` |
| 라인 | `--color-line` | `#E4E6DF` |
| 브랜드·액션 | `--color-primary` / `-dark` / `-tint` | `#1E5E88` / `#153F58` / `#E7F0F5` |
| 신청 가능 | `--color-ok` / `-tint` | `#2C7A57` / `#E6F1EC` |
| 확인 필요 | `--color-review` / `-tint` | `#4E5FA6` / `#ECEEF9` |
| 안 맞음 | `--color-no` / `-tint` | `#8A929E` / `#EAEBE6` |

- **폰트:** IBM Plex Sans KR (300–700).
- **radius:** 8 / 12 / 16 / pill. **spacing:** 4pt 배수. **그림자:** `--shadow-card`.
- **타입:** 모바일 질문 제목 24 → 데스크톱 36. 본문 15 → 16. 금액 34 → 40.

### "확인 필요" 색은 왜 인디고인가
디자이너 결정 사항이었습니다. 노랑=경고, 빨강=오류로 읽히면 안 되고(사용자 잘못이 아니며 가장 흔한 상태), 적합(초록)·미해당(회색)과도 구분돼야 해서 **중성 인디고**로 잡았습니다.

---

## 3. 컴포넌트 인벤토리 (CSS 클래스)

| 컴포넌트 | 클래스 | 메모 |
|---|---|---|
| 금액 입력 | `.amount` `.amount__num` `.amount__echo` `.amount__unknown` `.amount__opts/.amount__opt` | 주력 컴포넌트. 한글 에코 필수. `잘 모르겠어요`(null)와 `차가 없어요·0원`은 별도 컨트롤 |
| 정의 도움말 | `.help__toggle` `.help__panel` `.help__term` | 호버 툴팁 아님 — 그 자리에서 펼침(모바일 호버 없음). 원문 용어는 `.help__term`에 |
| 상시 안내 | `.guide` | 세대원 수처럼 오입 잦은 항목은 툴팁 금지, 상시 노출 |
| 스테퍼 | `.stepper` `.stepper__btn(--plus)` `.stepper__value` | 세대원 수 |
| 진행바 | `.progress` `.progress__fill` | **Tier 0에서만.** Tier 1부터는 끝이 정해진 미터 표시 안 함 |
| 판정 뱃지 | `.status--ok / --review / --no` | 색만으로 구분하지 않고 라벨·아이콘 병행 |
| 공고 카드 | `.notice` `.notice__title` `.notice__pdf` | PDF 링크 항상 |
| 사유 | `.reason` `.reason--missing` `.meter/.meter__fill` | `--missing`(사용자가 지금 해결 가능)는 시각적으로 구분 |
| 요약 배너 | `.banner` | "총자산 채우면 3건 확정" 식 집계 유도 |
| 프로필 행 | `.section` `.prow` `.chip--unknown` | `모름`은 회색 칩, `0원`은 값으로 다르게 |

---

## 4. 사유 코드 → 문구 → 카드 동작

엔진이 코드를 내보내고 프론트가 매핑합니다. `MISSING_PROFILE_DATA`(지금 해결 가능)와 나머지를 시각적으로 구분하는 게 핵심.

| 코드 | 문구 예시 | 카드에 붙는 것 |
|---|---|---|
| `INCOME_OVER_LIMIT` | 월소득이 기준(○○만원)을 넘어요 | 내 값 / 기준값 나란히 |
| `ASSETS_OVER_LIMIT` | 총자산이 기준(○억 ○○만원)을 넘어요 | 위와 동일 |
| `MISSING_PROFILE_DATA` | 총자산을 아직 안 알려주셨어요 | 그 필드로 가는 버튼(`.reason--missing`) |
| `BORDERLINE` | 기준에 아주 가까워요 (기준의 97%) | `.meter`로 경계선 표시 |
| `NO_RULE_DATA` | 이 유형은 아직 기준표가 없어요 | 시스템 한계 명시 |
| `MANUAL_CHECK_REQUIRED` | 공고문에만 있는 조건이 있어요 | PDF 링크 강조 |

(사유 코드는 총 11종. 위는 대표 6종.) 결과 목록 정렬은 **적합 → 확인 필요 → 미해당**, 미해당은 기본 접힘·개수만 노출.

---

## 5. 데이터 모델 (입력 필드)

티어별로 나눠 받습니다. Tier 0가 없으면 판정 자체가 안 되고, Tier 1은 비우면 `NEEDS_REVIEW`, Tier 2는 순위 계산용.

**Tier 0 (필수)**
`category`(신청 계층) · `personalIncome`(본인 월소득, 세전) · `householdSize`(세대원 수) · `householdIncome`(세대 월소득; 1인 세대면 본인값 자동복사) · `livesWithParents`(부모와 같은 세대?) · `isHomeless`(무주택) · `age`(생년월일로 받아 계산) · `residence`(시도 **+ 자치구**)
※ `maritalStatus`는 별도 질문 대신 가족 형태 하나로 유도.

**Tier 1 (비우면 확인 필요)**
`personalAssets` / `householdAssets` · `carValue`(0=무차량, null=모름 구분) · `parentsIncome` / `parentsAssets` · `isDualIncome` · `childrenBirthDates`(날짜로, 태아 포함) · `isBasicLivingBeneficiary` 외 수급/차상위/한부모

**Tier 2 (순위 계산용)**
`districtMovedInAt` · `incomeSourceLocation`(직장) · `universityLocation`(대학생) · `housingSubscriptionPayments`(청약 납입회차)

금액은 모두 원 단위 정수. 심사는 공적자료 기준이라 사용자 입력은 근사치 — **상한의 ±5% 안이면 확정하지 않고 `BORDERLINE`**.

---

## 6. 반응형 / 접근성

- **브레이크포인트:** 단일 `768px`. 모바일 퍼스트 → 데스크톱에서 온보딩은 세로 가운데 정렬(`.onboard`), 결과는 카드+rail 2단(`.result-layout`), 프로필은 2열, 사유는 가로 배치.
- 판정은 **색 단독으로 의미 전달 금지** — 라벨·아이콘 병행(색각 이상 대응).
- 금액/셀렉트는 실제 `<input>`/`<button>`으로, `label`과 `aria-*` 연결. 정의 도움말 토글은 `aria-expanded` 관리(코드 참고).
- 숫자 필드는 `inputmode="numeric"`로 숫자 키패드.

---

## 7. 카피 톤

행정 용어를 그대로 쓰지 않되 완전히 감추지도 않습니다. 풀어 쓴 문구를 본문에, 원문 용어(무주택세대구성원 등)를 각주(`.help__term`)에 둬서 사용자가 공고문과 대조할 수 있게. 결과 문구는 "~해 보여요 / ~가 필요해요" 계열로 단정하지 않기.

---

## 8. 이메일 → 공고 상세 흐름

**시나리오:** 하루 1~2회 묶음 알림 메일 → 사용자가 공고 하나 클릭 → `detail.html`(공고 상세).

### 알림 이메일 (`email.html`)
- 공고마다 **판정 뱃지 + 사유 첫 줄**(예: "소득이 기준에 아주 가까워요 외 1건"). 뱃지만 있는 알림은 열어볼 이유를 안 줍니다.
- 각 공고 링크: `/notices/{notice_id}?from=email` → 상세에서 "알림 메일에서 열었어요" 표기에 사용.
- 하단 집계 유도("총자산만 알려주시면 N건 확정") + 알림 설정 / 수신 해지.
- 제약: **CSS 변수·flex·grid·외부 CSS 금지**(Gmail/Outlook/네이버 미지원). 테이블 + 인라인 스타일, 시스템 한글 폰트. `{{placeholder}}`는 발송 서버가 채움. 알림 받을 판정 범위 기본값은 적합 + 확인 필요.
- 마감 임박 리마인더는 이 묶음과 **별도 메일**로 발송.

### 공고 상세 (`detail.html`)
위에서부터 사용자가 궁금한 순서:
1. **제목 블록 + 판정 요약** — 판정 라벨 + 이유 한 문장(비단정 카피).
2. **판정 근거** — 걸린 항목은 펼치고, 통과 항목은 **기본 접힘**(개수 노출).
   - `BORDERLINE`: 경계선 미터 + 내 값/기준 + 원문 용어 각주
   - `MISSING_PROFILE_DATA`: 그 필드 입력으로 바로 가는 버튼(`/profile#assets` 등)
   - `MANUAL_CHECK_REQUIRED`: "직접 확인" + 공고문 해당 페이지 링크
3. **예상 순위** — 자격과 별개. 모르는 값(전입일 등)은 입력 유도.
4. **공급 정보 / 일정 타임라인** — 현재 단계(`aria-current="step"`) 강조.
5. **행동 영역** — 주 버튼: 공고문 원문(PDF), 보조: 기관 신청 사이트, **마감 전 다시 알려주기** 토글.
   - 데스크톱: 오른쪽 sticky rail / 모바일: 하단 고정 액션 바.
6. 각주: "○○년 기준표로 판정 · 1차 필터".

필요한 API 필드(상세): `notice{id, agency, type, title, region, supplyCount, areaRange, deposit, rentRange, schedule[], pdfUrl, applyUrl}`, `judgment{status, summary, reasons[{code, field, myValue, limit, ratio, pdfPage}], passed[]}`, `rank{residence, movedInBonus}`, `reminder{enabled}`.
