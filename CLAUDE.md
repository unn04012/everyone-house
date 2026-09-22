# CLAUDE.md

공공임대 알리미 — 공공임대 모집공고를 수집해 내 소득·자산 기준으로 필터링하고 알림을 보내는 개인용 도구.
제품 스펙(데이터 소스 실측값, 자격 기준, 비용)은 [SPEC.md](SPEC.md) 참조. 이 문서는 **코드 구조와 컨벤션**만 다룬다.

코드 스타일은 `~/Documents/project/lotto-automation`(NestJS + DDD)의 컨벤션을 따른다. 판단이 갈리면 그 프로젝트를 기준으로 삼는다.

---

## 스택

모두 최신 버전. 아래는 **실제로 설치해 빌드·마이그레이션·테스트까지 통과시킨 조합**이다 (2026-09-21 검증).

| 항목 | 버전 | 비고 |
|---|---|---|
| Node | **26.9.0** | `.nvmrc`. Nest 12 engines `>=20`, TypeORM 1.1.1 은 `>=24.11` |
| NestJS | **12.0.4** | **ESM 전용 패키지** (`"type": "module"`) |
| TypeScript | **7.0.2** | 네이티브(Go) 포트. **JS 컴파일러 API 없음** — 파급이 크다 (아래) |
| ORM | **typeorm 1.1.1** + `@nestjs/typeorm` 12.0.1 + `pg` 8.23.0 | |
| 모노레포 | npm workspaces | npm 11.19.1 |
| 검증 | zod **4.6.5** (DTO), Joi **18.2.9** (env) | lotto-automation 은 zod 3 |
| 테스트 | Jest **30.5.2** + **@swc/jest** | ts-jest 불가 |
| 포맷·린트 | prettier **3.9.8** + **oxlint 1.83.0** | ESLint/typescript-eslint 불가 |
| DB | PostgreSQL 17 (`docker compose up -d postgres`, 포트 5433) | |

### 근본 원인: TS 7 은 JS 컴파일러 API를 제공하지 않는다

TypeScript 7 은 네이티브 Go 바이너리다. `require('typescript')` 로 얻던 API가 사라졌다 — 직접 확인한 결과:

```
ts.version           // '7.0.2'
ts.createProgram     // undefined
ts.createSourceFile  // undefined
ts.transpileModule   // undefined
ts.SyntaxKind        // undefined
```

**TypeScript 의 AST/프로그램 API에 의존하는 모든 도구가 동작하지 않는다.** 아래 제약들은 개별 사건이 아니라 이 하나의 결과다:

| 도구 | 상태 | 대체 |
|---|---|---|
| `ts-jest` | peer 가 `typescript: ">=4.3 <7"` | **`@swc/jest`** (swc 자체 TS 파서) |
| `typescript-eslint` | peer 가 `typescript: ">=4.8.4 <6.1.0"`, v9 미출시 | **`oxlint`** (Rust 자체 파서) |
| `ts-node` | 동작 불가 | 마이그레이션을 **컴파일된 JS**로 실행 |
| `@nestjs/cli` | `typescript: ~6.0.2` 고정 → `nest build` 는 TS 6 사용 | 플레인 **`tsc`** |
| `prettier` | ✅ 정상 (자체 파서 내장, typescript peer 없음) | 그대로 사용 |

TS 7 을 쓰는 한 이 구도는 바뀌지 않는다. 타입 체크는 `tsc` 가, 린트는 oxlint 가, 변환은 swc 가 맡는 3분할 구조로 간다. **타입 인식 린트 규칙(no-floating-promises 등)은 포기한다** — typescript-eslint 가 TS 7 을 지원할 때까지.

### 모듈 시스템: ESM

Nest 12 가 ESM 전용으로 전환했다. CJS 로 빌드해도 Node 26 의 `require(esm)` 으로 돌아가지만 영구적으로 interop 에 기대는 것이고, 의존성이 top-level await 을 쓰면 `ERR_REQUIRE_ASYNC_MODULE` 로 깨진다. 그래서 ESM 이다:

- `package.json` 에 `"type": "module"`, tsconfig 는 `"module": "nodenext"`
- **상대 import 에 `.js` 확장자를 붙인다** (TS 소스에서도 `.js`)
- **타입 전용 import 는 반드시 `import type`.** swc 는 파일 단위 변환이라 타입을 지우지 못하고 실제 import 로 남긴다:
  ```
  SyntaxError: The requested module './notice.repository.interface.js'
  does not provide an export named 'INoticeRepository'
  ```
  리포지토리·어댑터 인터페이스가 많아 자주 걸리므로 `verbatimModuleSyntax: true` 로 컴파일 단계에서 강제한다.
- Node 내장 모듈은 `node:` prefix (`import { randomUUID } from 'node:crypto'`). 전역 `crypto` 는 타입이 잡히지 않는다.

### TS 7 에서 제거된 tsconfig 옵션

lotto-automation 설정을 복사하면 아래에서 막힌다. 전부 실제로 에러를 받아 확인했다.

| 옵션 | 에러 | 대응 |
|---|---|---|
| `baseUrl` | TS5102 제거됨 | 사용하지 않음 (import 규칙 참조) |
| `moduleResolution: "node10"` | TS5108 제거됨 | 생략 (`nodenext` 기본값) |
| `lib: ["ES2023"]` | TS6046 유효하지 않은 값 | **`lib` 자체를 쓰지 않는다** (`target` 이 암시) |
| `rootDir` 미지정 | TS5011 | `"rootDir": "./src"` 명시 |

→ **`src/*` 경로 별칭은 쓰지 않는다.** `baseUrl` 이 없어졌고 `tsconfig-paths` 런타임 훅은 ts-node 와 함께 죽었다. 대신:
- **패키지 내부**: 상대 경로 + `.js` 확장자
- **패키지 간**: 워크스페이스 패키지명 (`@everyone-house/domain`) — npm workspaces 심링크로 해결

### 테스트 실행에 필요한 플래그

Nest 패키지가 ESM 이라 Jest 가 `require(esm)` 으로 로드해야 하는데, 그 경로가 `vm.SourceTextModule` 존재 여부로 게이트된다 (= `--experimental-vm-modules`). 없으면:
```
Must use import to load ES Module: .../@nestjs/testing/index.js
```
루트 `package.json` 에 박아 두었다: `"test": "NODE_OPTIONS=--experimental-vm-modules jest"`

`.swcrc` 의 데코레이터 설정도 필수다. `decoratorMetadata: true` 가 없으면 **Nest DI 가 조용히 실패한다**:
```json
{ "jsc": { "parser": { "syntax": "typescript", "decorators": true },
           "transform": { "legacyDecorator": true, "decoratorMetadata": true },
           "keepClassNames": true },
  "module": { "type": "es6" } }
```

---

## TypeORM 규약

### ORM 엔티티 (`packages/db/src/schema/*.orm-entity.ts`)

- 파일명 `<name>.orm-entity.ts`, 클래스명 `<Name>OrmEntity` — 도메인 엔티티(`NoticeEntity`)와 헷갈리지 않게 한다
- **컬럼명은 `name:` 으로 snake_case 명시.** TypeORM 기본값은 프로퍼티명 그대로라 camelCase 컬럼이 생긴다
- **프로퍼티에 `!` (definite assignment).** `strictNullChecks` 가 켜져 있으면 `strictPropertyInitialization` 이 따라오고, ORM 엔티티는 생성자로 초기화하지 않아 TS2564 가 뜬다
- **jsonb 컬럼은 `unknown` 으로 선언한다.** TypeORM 의 `QueryDeepPartialEntity` 가 인덱스 시그니처 타입을 재귀 전개해 `upsert` 에서 타입이 깨진다. 형태는 도메인 타입이 보장하고, 리포지토리 매퍼에서 좁힌다
  - nullable jsonb 에 `null` 을 넣을 수 없다 (`QueryDeepPartialEntity<unknown>` 에 null 이 없음) → `?? undefined` 로 "컬럼을 건드리지 않음" 처리
- 금액은 `bigint` + transformer 로 number 왕복 (pg 드라이버가 bigint 를 문자열로 준다)

### 마이그레이션

**`synchronize` 는 어떤 환경에서도 쓰지 않는다.** 스키마 변경은 전부 마이그레이션이다 (SPEC §5 이식성).

CLI 는 **컴파일된 JS datasource** 로 실행한다 (ts-node 불가):
```bash
npm run migration:generate --name=AddSomething   # build → generate → import 교정
npm run migration:run
npm run migration:revert
```

`migration:generate` 가 만드는 코드는 ESM 에 맞지 않는다 — `import { MigrationInterface, QueryRunner } from "typeorm"` 는 둘 다 타입이라 TS1484 로 실패하고, 통과시켜도 런타임에 깨진다. `scripts/fix-migration-imports.mjs` 가 생성 직후 `import type` 으로 바꿔 주며, `migration:generate` 스크립트에 이미 연결되어 있다. **생성된 마이그레이션은 커밋 전에 SQL 을 눈으로 확인한다.**

## 디렉터리 구조

```
everyone-house/
├─ apps/
│  ├─ api/         # Render Web Service — HTTP
│  ├─ crawler/     # Render Cron Job — 수집 파이프라인 (나중에 Lambda 이관 가능)
│  └─ web/         # Render Static Site — 프론트
├─ packages/
│  ├─ domain/      # 엔티티 · VO · 리포지토리 인터페이스 · 자격판정 엔진 · 기준표
│  └─ db/          # TypeORM 스키마 · 마이그레이션 · 리포지토리 구현 · DataSource
├─ scripts/
│  └─ fix-migration-imports.mjs   # 생성된 마이그레이션의 ESM import 교정
├─ docker-compose.yml             # 로컬 Postgres 17 (포트 5433)
├─ tsconfig.base.json             # 전 패키지 공통 컴파일러 옵션
├─ jest.config.js · .swcrc · .oxlintrc.json · .prettierrc
├─ .nvmrc · .env.example
├─ CLAUDE.md · SPEC.md
```

### 레이어 의존 방향

```
apps/*  ──▶  packages/db  ──▶  packages/domain
apps/*  ─────────────────────▶  packages/domain
```

- **`packages/domain`은 아무것도 의존하지 않는다.** I/O 없음. `package.json`에 DB 클라이언트·HTTP 클라이언트·NestJS를 넣지 말 것. 순수성을 규율이 아니라 빌드 에러가 지키게 하는 게 이 경계의 목적이다.
- `packages/db`가 `domain`의 리포지토리 인터페이스를 구현한다. 역방향 의존 금지.
- `apps/api`와 `apps/crawler`는 **서로를 import 하지 않는다.** 공유할 게 생기면 `packages/`로 올린다.

### apps/crawler 내부

```
apps/crawler/src/
├─ entry/
│  ├─ main.ts          # CLI 엔트리 (Render Cron Job) — runCrawl() 호출만
│  └─ lambda.ts        # (미래) Lambda handler — runCrawl() 호출만
├─ crawler.service.ts  # runCrawl(): 수집 → 정규화 → dedupe → 판정 → 알림
├─ sources/            # 소스 어댑터 (인프라)
│  ├─ source.adapter.interface.ts
│  ├─ myhome-api.adapter.ts
│  ├─ sh-portal.adapter.ts
│  └─ gh-apply.adapter.ts
└─ notification/
```

**파이프라인은 호출 가능한 함수여야 한다.** 엔트리 파일은 얇은 껍데기만. top-level 부작용 금지. Lambda 이관이 "handler 파일 하나 추가"로 끝나는 이유가 이것뿐이다.

크롤러는 상주 프로세스를 가정하지 않는다 — in-memory 스케줄러, `setInterval`, 워밍된 커넥션 풀 재사용 금지.

HTTP 서버가 필요 없으므로 `NestFactory.createApplicationContext()`로 DI 컨텍스트만 띄우고, 끝나면 `app.close()`.

---

## DDD 컨벤션

### 전부 클래스로 쓴다 (OOP)

이 프로젝트에 **최상위 함수(top-level function)를 두지 않는다.** 로직은 전부 클래스의 메서드다.

- 모듈 수준 `export const fn = () => {}` / `export function fn()` 금지
- 헬퍼는 모듈 스코프 화살표 함수가 아니라 **private 메서드**로 둔다
- 상수 묶음도 클래스의 `static readonly` 로 (`HtmlFetcher.USER_AGENT`, `EligibilityTable2026.RULESET`)
- 값 묶음을 만들어 주는 코드는 팩토리 클래스로 (`DataSourceOptionsFactory.create()`, `EligibilityTable2026.create()`)
- 의존성은 생성자 주입. 순수 로직 클래스도 마찬가지다 — `EligibilityEngine` 은 기준표를 생성자로 받는다

순수성은 클래스로 만들어도 유지된다. `EligibilityEngine` 은 I/O·현재 시각·전역 상태에 접근하지 않고, 기준표를 생성자로 주입받아 같은 입력이면 항상 같은 결과를 낸다 — "함수여야 순수하다"는 것이 아니라 "의존이 명시적이어야 순수하다".

예외는 빌드 도구 스크립트(`scripts/*.mjs`)뿐이다. 애플리케이션 코드가 아니다.


### 엔티티

`packages/domain/src/<context>/domain/*.entity.ts`

- private 필드는 `_` prefix, 불변 필드는 `readonly`
- getter로만 노출, setter는 정말 필요할 때만
- **생성자는 private.** 생성은 `static create()`, 영속 데이터 복원은 `static fromSchema()`
- 비즈니스 규칙은 엔티티 메서드로 (서비스에 흘리지 말 것)
- plain object가 필요하면 `getXxx()` 메서드로 반환

```ts
export class NoticeEntity {
  private readonly _noticeId: string;
  private readonly _sourceId: SourceId;
  private _status: NoticeStatus;

  get noticeId() {
    return this._noticeId;
  }

  private constructor({ noticeId, sourceId, status }: { noticeId: string; sourceId: SourceId; status: NoticeStatus }) {
    this._noticeId = noticeId;
    this._sourceId = sourceId;
    this._status = status;
  }

  public static create({ ... }): NoticeEntity { ... }
  public static fromSchema(schema: NoticeSchema): NoticeEntity { ... }
}
```

### 리포지토리

- 인터페이스: `packages/domain/src/<context>/repository/<name>.repository.interface.ts`, 이름은 `I<Name>Repository`
- 구현: `packages/db/src/repository/<name>-repository-postgres.ts`, 이름은 `<Name>RepositoryPostgres`
- 인터페이스는 **도메인 엔티티만** 주고받는다. TypeORM 타입(`Repository`, `QueryDeepPartialEntity`)이 인터페이스 시그니처에 새어나오면 안 된다
- 구현체에 private 매퍼를 둔다: `_mapEntityToRow` / `_mapRowToEntity`
- dedupe 는 **DB 유니크 제약**에 기대므로(`@Index(['sourceId','externalId'], { unique: true })`) 인메모리 목으로는 검증이 안 된다 → 리포지토리 테스트는 실제 Postgres 로 돌린다

### 스키마

세 층을 구분한다:

| 층 | 위치 | 역할 |
|---|---|---|
| `NoticeEntity` | `packages/domain` | 도메인 엔티티. 불변식과 비즈니스 규칙 |
| `NoticeSchema` | `packages/domain` | 영속 형태(plain interface). 엔티티↔ORM 사이의 계약 |
| `NoticeOrmEntity` | `packages/db` | TypeORM 매핑. 데코레이터와 컬럼 정의 |

`NoticeEntity.fromSchema(schema)` 로 복원하고, `getNotice()` 로 `NoticeSchema` 를 꺼낸다. ORM 엔티티는 `packages/domain` 을 의존하지만(enum 재사용) 그 역은 없다.

### DTO

zod 스키마(lowerCamelCase const) + `z.infer` 타입(PascalCase, 같은 이름). `.describe()`로 한글 설명을 붙인다.

```ts
export const createProfileRequestDto = z.object({
  householdSize: z.number().min(1).describe('가구원수'),
  monthlyIncome: z.number().min(0).describe('월소득 (원)'),
});

export type CreateProfileRequestDto = z.infer<typeof createProfileRequestDto>;
```

### 유니온 타입

enum + `keyof typeof` 조합을 쓴다.

```ts
export enum VerdictEnum {
  LIKELY_ELIGIBLE = 'LIKELY_ELIGIBLE', // 적합 가능성 높음
  NEEDS_REVIEW = 'NEEDS_REVIEW',       // 검토 필요
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',       // 미해당
}
export type Verdict = keyof typeof VerdictEnum;
```

### DI

인터페이스 주입은 Symbol로. 레지스트리는 각 앱의 `src/symbols.ts`에 모은다.

```ts
export const Symbols = {
  noticeRepository: Symbol.for('INoticeRepository'),
  sourceAdapters: Symbol.for('ISourceAdapter[]'),
};
```

```ts
@Module({
  providers: [
    { provide: Symbols.noticeRepository, useClass: NoticeRepositoryPostgres },
  ],
})
```

### Config

도메인별로 4파일 세트 (`src/config/<name>/`):

- `<name>-configuration.ts` — `registerAs('name', () => ({ ... process.env }))`
- `<name>-config.service.ts` — getter만 있는 `@Injectable()` 서비스
- `<name>-config.module.ts` — `ConfigModule.forRoot({ load, envFilePath, validationSchema })`
- `<name>.validation.ts` — Joi 스키마

**env는 config 서비스를 통해서만 읽는다.** 도메인·서비스 코드에서 `process.env` 직접 접근 금지.

---

## 자격 판정 엔진 (`packages/domain/src/eligibility/`)

이 프로젝트에서 가장 틀리기 쉽고 테스트 가치가 높은 코드다. 규칙:

1. **순수 함수.** I/O·DB·현재 시각 접근 금지.
2. **기준표를 생성자로 주입받는다.** 엔진이 내부에서 "올해 표"를 집어오면 안 된다.
   ```ts
   new EligibilityEngine(EligibilityTable2026.create()).judge(profile, notice)  // ✅ 연도가 명시적
   ```
   엔진이 연도를 숨기면 과거 판정을 재현할 수 없다.
3. **기준표는 코드 상수.** `tables/2026.ts` 처럼 연도별 파일. DB 테이블로 두지 않는다 — 연 1회 갱신이라 배포 주기와 일치하고, git 히스토리가 그 자체로 감사 로그가 된다.
4. **결과는 3단계**(`Verdict`)이며 **항상 사유를 동반한다.** yes/no로 단정하지 않는다. 상세 자격이 공고문 PDF에만 있는 경우가 많아 `NEEDS_REVIEW`가 정상 상태다.
5. `matches` 행에 판정에 사용한 ruleset 버전(`"2026.1"`)을 함께 저장한다. "3월엔 왜 미해당이었지"를 추적할 유일한 방법.

---

## 소스 어댑터 (`apps/crawler/src/sources/`)

모든 어댑터는 `ISourceAdapter`를 구현하고 **정규화된 `NoticeEntity`를 반환한다.** 소스별 원시 형태(HTML 파싱 결과, 마이홈 JSON)는 어댑터 밖으로 새지 않는다. 원본은 `raw_json`에 보존.

수집 예의 (SPEC §9):
- 하루 1~2회만. robots.txt 확인. User-Agent 명시.
- 실패 시 지수 백오프.
- 한 소스가 실패해도 나머지는 계속 진행한다 (`Promise.allSettled`).
- 원본 공공기관만 수집. aggregator(`public-home.com` 등) 크롤링 금지.

헤드리스 브라우저는 쓰지 않는다 — 전 소스의 핵심 목록이 서버 렌더링이라 `fetch` + HTML 파서로 충분하다(SPEC §3 실측). Playwright를 추가하려면 먼저 그 결론이 깨졌는지 확인할 것.

---

## 테스트

- 위치: 대상 폴더 하위 `__test__/`
- 파일명: `*.test.ts` (`*.spec.ts`도 인식)
- `describe` + **`test()`** 사용 (`it()` 아님)
- Nest `Test.createTestingModule()`으로 조립, 외부 의존은 `__test__/<name>-mock.ts` 클래스를 `useClass`로 교체
- `packages/domain`은 Nest 없이 순수 단위 테스트. 자격 판정 엔진은 경계값 케이스를 반드시 덮는다.
- 실행: `NODE_OPTIONS=--experimental-vm-modules jest` (스택 제약 5번). transform은 `@swc/jest`.

---

## 포맷 / 린트

`.prettierrc`: `singleQuote: true`, `trailingComma: "all"`, `printWidth: 180` (lotto-automation 과 동일)

린트는 **oxlint** (`.oxlintrc.json`, correctness=error / suspicious=warn). ESLint + typescript-eslint 는 TS 7 에서 동작하지 않는다 — 타입 인식 규칙은 포기하고 타입 검증은 `tsc` 에 맡긴다.

```bash
npm run build      # 전 워크스페이스 tsc
npm test           # jest (swc)
npm run lint       # oxlint
npm run format     # prettier
```

기타:
- private 필드·메서드에 `_` prefix (`_mapRowToEntity`)
- public 메서드에 `public` 명시
- 주석·JSDoc 은 한글로
- import: 패키지 내부는 상대 경로 + `.js` 확장자, 패키지 간은 `@everyone-house/*`
- 타입 전용 import 는 `import type`

## 배포 / 이식성 제약

SPEC §5 원칙: 이관은 "코드 재작성"이 아니라 "설정 변경"이어야 한다.

- DB 접속은 **`DATABASE_URL` 환경변수로만.**
- `packages/db`의 클라이언트 팩토리는 **드라이버 교체가 가능해야 한다** (풀 기반 ↔ 서버리스 HTTP 드라이버). Lambda + Postgres는 커넥션 고갈이 고전적 지뢰라 이관 시 여기만 바꿔 대응한다.
- 12-factor: 설정=env, 상태=DB, 컨테이너=무상태.
- Dockerfile은 각 앱에 두되 **빌드 컨텍스트는 리포 루트** (workspace 패키지를 포함해야 함). Render에서도 Root Directory를 이에 맞게 설정.
- 프로덕션 DB를 EC2 위 컨테이너에 직접 띄우지 말 것 → RDS 또는 Neon/Supabase.

---

## 하지 말 것

- `packages/domain`에 I/O 의존성 추가
- `apps/api` ↔ `apps/crawler` 상호 import
- 엔티티 생성자 public 노출, 엔티티 우회한 필드 직접 조립
- 도메인 로직을 서비스에 흘리기
- `process.env` 직접 접근
- 자격 판정을 yes/no 2단계로 축약
- 기준표를 DB 테이블로 이동
- 크롤러 엔트리에 top-level 부작용
- `ts-jest` · `typescript-eslint` · `ts-node` · `nest build` 도입 (전부 TS 7 에서 동작 불가)
- `baseUrl` / `lib` / `src/*` 경로 별칭 / `tsconfig-paths`
- 타입 전용 import 를 일반 `import` 로 두기 (런타임 링크 에러)
- `.swcrc` 에서 `decoratorMetadata` 누락 (DI 가 조용히 깨짐)
- TypeORM `synchronize: true` (어떤 환경에서도)
- 기준표에 추측값 채우기 — 공식 출처로 확인된 수치만
- 최상위 함수 export (전부 클래스 메서드로)
