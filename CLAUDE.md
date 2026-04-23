# PolyglotMonorepo — 에이전트 팀 규약

## 총원 구조 (메인 에이전트 = 프로젝트 전체 팀장)

메인 에이전트가 프로젝트 전체 팀장 역할로 아래 6개 서브팀을 **직접 호출**해 파이프라인을 돌린다.
Claude Code 플랫폼이 sub-agent nesting 을 지원하지 않으므로 팀장 에이전트는 Task 도구를 가지지 않고, 모든 위임은 메인이 수행.

1. **기획팀** — `.claude/agents/planning/`
2. **프론트엔드** — `.claude/agents/frontend/`
   - 디자인팀 (`frontend/design/`)
   - UI팀 (`frontend/ui/`) — `libs/ui` 소유
   - 프론트 개발팀 (`frontend/web/`)
   - 프론트 테스트팀 (`frontend/test/`)
3. **백엔드 개발팀** — `.claude/agents/backend/`
4. **통합테스트팀** — `.claude/agents/integration/`

각 팀의 구성/역할/호출 시점은 [`.claude/agents/README.md`](./.claude/agents/README.md) 참조.

## 프로젝트 모드

이 템플릿은 세 가지 운영 모드를 지원한다. **모드는 `docs/tech-stack/backend.md` 헤더의 `mode` 필드가 단일 진실 소스**. 메인 에이전트가 파이프라인을 시작하기 전에 이 필드를 읽고 아래 표에 따라 팀을 활성/비활성화한다.

### 모드 정의

| 모드 | 뜻 | `docs/tech-stack/backend.md` 헤더 예 |
|---|---|---|
| `inhouse` | 이 레포의 `apps/example-api` 가 실제 백엔드. 이 템플릿의 기본. | `mode: inhouse` + engine/profile 필드 |
| `external` | 백엔드는 외부에 존재. `swagger.json` 또는 서버 URL 제공. | `mode: external` + `baseUrl:` + `swagger:` |
| `mock` | 백엔드 미정/대기. MSW 로 mock 해서 프론트만 먼저 구현. | `mode: mock` + `contract:` (+ 선택적 `fallbackTo:`) |

### 모드별 활성 팀

| 모드 | 활성 | 비활성 |
|---|---|---|
| `inhouse` | 기획 · 디자인 · UI · 프론트개발 · 프론트테스트 · **백엔드** · **통합테스트** | — |
| `external` | 기획 · 디자인 · UI · 프론트개발 · 프론트테스트 · **통합테스트** | 백엔드 |
| `mock` | 기획 · 디자인 · UI · 프론트개발 · 프론트테스트 | 백엔드, 통합테스트 |

- `external` 모드의 통합테스트팀은 외부 API 의 실 endpoint 에 대한 결합 시나리오만 검증. DB 스키마/트랜잭션은 검증 범위 밖.
- `mock` 모드에서는 `tests/e2e/**` (프론트 테스트팀) 가 MSW service worker 위에서 돌며 통합의 역할까지 흡수. `tests/integration/**` 는 **존재해도 실행하지 않음** (mock 과 실 백엔드가 붙기 전까지 비활성).
- 비활성 팀의 에이전트 파일은 `.claude/agents/` 에 그대로 존재하지만 메인이 호출하지 않는다. 모드 전환 시 즉시 복귀 가능.

### mock 모드 파일/셋업 규약

- MSW handler 위치: `apps/example-web/src/mocks/**` (프론트 개발팀 소유).
- Service worker 파일: `apps/example-web/public/mockServiceWorker.js` (`npx msw init` 산출물, **수정 금지**).
- 토글: `.env` 의 `VITE_USE_MOCK=true` 일 때만 `main.tsx` 에서 `worker.start()` 호출 (dev 전용, prod 번들에서 tree-shake).
- 계약 출처: `docs/prd/<feature>.md` 의 API 섹션 또는 별도 `libs/api-types` 수작업 타입.
- **MSW 기본 설치 안 함** — 템플릿 원칙 유지. 모드가 `mock` 으로 설정된 프로젝트에서만 `pnpm add -D msw --filter example-web` + `npx msw init apps/example-web/public --save` + `src/mocks/` 스캐폴드를 1회 실행한다. 이 셋업은 메인(프로젝트 전체 팀장) 책임.

### external 모드 규약

- `libs/api-types` 는 외부 `swagger.json` 에서 `openapi-typescript` 로 자동 생성. 수작업 편집 금지.
- `apps/example-web/.env` 의 `VITE_API_BASE_URL` 에 외부 서버 URL. Vite dev 프록시는 이 변수를 기반으로 구성.
- `apps/example-api/**` 는 삭제하지 않고 보관 (향후 `inhouse` 로 되돌릴 가능성). 단 빌드 파이프라인에서는 제외.

### 모드 전환 체크리스트 (메인이 수행)

| 전환 | 체크리스트 |
|---|---|
| `mock → external` | (1) `docs/tech-stack/backend.md` 헤더 `mode: external` + `baseUrl` + `swagger` 갱신 → (2) `libs/api-types` 를 외부 스펙에서 재생성 → (3) `apps/example-web/src/mocks/**` 삭제 + `pnpm remove msw --filter example-web` → (4) `.env.VITE_USE_MOCK` 제거 → (5) 통합테스트팀 활성, `tests/integration/**` 스펙 작성/복구. |
| `mock → inhouse` | 위 (1)(3)(4) + `apps/example-api/**` 스캐폴드 확인 + Flyway `V1` 재생성 + 백엔드팀 활성. |
| `external → inhouse` | `apps/example-api/**` 스캐폴드 + Flyway `V1` + `VITE_API_BASE_URL` 을 프록시(`/api`) 기본값으로 되돌림 + 백엔드팀 활성. |
| `inhouse → external` | `apps/example-api/**` 는 보존, 빌드만 off + `baseUrl`/`swagger` 갱신 + 백엔드팀 비활성. |
| `inhouse → mock` | 비권장 (이미 백엔드가 있는데 mock 으로 되돌리는 것). 단기 회귀 실험 외 사용 금지. |

각 전환은 **메타 작업** 이므로 메인이 직접 커밋 (`chore(config): mode <prev> → <next> 전환` 류).

## 표준 파이프라인

**공통 흐름** — `[1] → [2] → [3] → [4/5] → [6] → [7] → [9]`. 단계 [4] 의 백엔드 축과 단계 [7] 통합 e2e 는 **모드에 따라 스킵**. 단계 [2] 는 두 경로 중 **프로젝트별로 하나** 선택.

```
[1] 기획 통합       doc-consolidator → stitch-brief-writer → planning-lead (커밋)

[2] 화면정의서 획득 — 두 경로 중 하나:
    [2a] Stitch 수동 경로 (기본)
         사용자가 Stitch (또는 대체 UX 툴) 실행 → 결과를 docs/screens/*.md 로 직접 투입
    [2b] 시안 프로세스 경로 (대안)
         screen-concepter → docs/design-notes/<feature>-variants.md (카탈로그)
         → 사용자(또는 메인)가 시안 선택
         → 메인이 선택된 시안을 docs/screens/*.md 로 승격 (기획팀 소유권의 예외 대행)
         → design-lead 가 variants.md 커밋, 메인이 screens/*.md 커밋
         (외부 툴 없이 팀 내부에서 libs/ui 제약 반영된 시안만 쓰고 싶을 때)

[3] 디자인 노트     design-trend-scout → design-lead (커밋)          ← 선택
[4] 백엔드 ∥ UI    [inhouse 만] backend-developer → backend-lead (커밋)
                   [모든 모드] ui-composer → ui-storybook-curator → ui-library-tester → ui-lead (커밋)
[5] 프론트 화면     frontend-developer → design-consistency-auditor → frontend-lead (커밋)
                   (mock 모드는 frontend-developer 가 src/mocks/ 핸들러도 함께 작성)
[6] 화면 e2e        frontend-e2e-tester → frontend-test-lead (커밋)
                   (mock 모드는 MSW 서비스워커 위에서 실행)
[7] 통합 e2e        [inhouse | external 만] integration-e2e-runner → integration-lead (커밋)
                   (mock 모드는 스킵 — [6] 이 커버)
[8] 실패 루프       lead FAIL → 해당 팀원 재호출 (≤ 3회)
[9] 사후 감사       spec-auditor → planning-lead (커밋)
```

### [2b] 시안 프로세스 규약

- **언제 고르나**: 외부 Stitch/Figma AI 를 쓸 수 없거나, 여러 레이아웃 대안을 팀 내부에서만 비교하고 싶을 때.
- **산출물**: `docs/design-notes/<feature>-variants.md` (디자인팀 소유). 페이지당 시안 2~4개, ASCII 와이어프레임 + `@monorepo/ui` 컴포넌트 매핑 표.
- **승격**: 사용자가 시안을 선택하면 **메인이 대행** 해 `docs/screens/<page>.md` 를 `docs/screens/README.md` 필수 섹션 포맷으로 생성. 이 예외적 대행이 허용되는 이유 — Stitch 경로의 "사용자 수동 투입" 을 "사용자 선택 + 메인 승격" 으로 대체한 것이라, 의사결정 주체는 여전히 사용자.
- **primitive 부재**: 시안에 쓰인 `@monorepo/ui` primitive 가 현재 없으면 variants.md 에 "신규 (UI팀 요청)" 로 마킹. 해당 시안이 선택되면 [4] 단계 UI팀 라인이 primitive 신설부터 진행.
- **PRD 이탈 방지**: 시안이 PRD V1 범위를 넘는 기능(검색/필터/정렬 등) 을 제안하면 screen-concepter 가 "위험/전제" 로 라벨링. 선택 시 PRD 개정 선행.

## UI 라이브러리 우선 규칙

**새 UI가 필요하면 ad-hoc 컴포넌트를 만들지 말고 `@monorepo/ui` 를 먼저 활용.**

1. `frontend-developer` 가 `libs/ui/src/components/` 를 탐색해 필요 primitive 가 있는지 확인.
2. 없으면 "UI팀 신규 primitive 요청" 을 리포트로 반환.
3. 메인이 `ui-composer → ui-storybook-curator → ui-library-tester → ui-lead` 순 호출.
4. UI팀 커밋 완료 후 `frontend-developer` 재호출해서 primitive 교체.

**앱 코드 내부에 범용 primitive 금지** — `apps/example-web/src/components/` 에는 해당 페이지에서만 쓰이는 **합성 컴포넌트** (예: `UserListRow`) 만 허용. 그 내부 구성도 `@monorepo/ui` primitive 기반.

## 파일 편집 소유권

| 경로 | 편집 가능 팀 |
|---|---|
| `docs/prd/**`, `docs/screens/**`, `docs/stitch-brief/**`, `docs/audit/**` | 기획팀 (단 `docs/screens/**` 는 [2b] 경로일 때 메인이 선택 승격 대행 허용) |
| `docs/design-notes/**` | 디자인팀 (시안 카탈로그 `*-variants.md` 포함) |
| `libs/ui/**` | UI팀 |
| `libs/tokens/styles/__tokens-*.css` | UI팀 (`scripts/apply-theme-colors.mjs` 경유 필수, 의도 결정은 디자인팀) |
| `libs/tailwind-config/globals.css` (Tailwind `@theme inline` 매핑) | UI팀 |
| `apps/example-web/src/**` | 프론트 개발팀 |
| `apps/example-web/src/mocks/**` (mock 모드 전용) | 프론트 개발팀 |
| `apps/example-web/public/mockServiceWorker.js` | **수정 금지** (`npx msw init` 산출물, 모드 셋업 스크립트로만 생성/삭제) |
| `apps/example-web/tests/e2e/**` | 프론트 테스트팀 |
| `apps/example-web/tests/integration/**` | 통합테스트팀 (`inhouse` / `external` 모드에서만 활성) |
| `apps/example-api/**` | 백엔드팀 (`inhouse` 모드에서만 활성) |
| `libs/ui/tests/**` | UI팀 (ui-library-tester) |
| `docs/tech-stack/**` | 메인(프로젝트 전체 팀장) — 기술 스택 결정 기록 |
| `.claude/**`, `CLAUDE.md`, 루트 설정 | 메인(프로젝트 전체 팀장) |

## 작업 검증 규칙 (팀별)

| 변경 계층 | 책임 팀 | 필수 검증 |
|---|---|---|
| Kotlin, Gradle, Flyway | 백엔드팀 | `pnpm nx run example-api:lint` + `:build`, Flyway 버전 충돌 없음 (V1 불변) |
| `libs/ui/**` | UI팀 | `pnpm nx run example-web:build` + `pnpm --filter @monorepo/ui build-storybook` + `ui-library-tester` 통과 |
| `libs/tokens/**` 색상 | UI팀 (의도는 디자인팀) | `scripts/apply-theme-colors.mjs` 경유 필수 |
| `apps/example-web/src/**` React | 프론트 개발팀 | `pnpm nx run example-web:lint` + `:build` |
| 디자인 일관성 | 디자인팀 | `design-consistency-auditor` Critical 0 |
| 화면 단위 e2e | 프론트 테스트팀 | `pnpm nx run example-web:e2e` 전체 통과 |
| 통합 e2e | 통합테스트팀 | 실 API + DB 기동 + `tests/integration/**` 통과 |
| `docs/prd`, `docs/screens`, `docs/stitch-brief`, `docs/audit` | 기획팀 | 필수 섹션 / 링크 무결성 / 금지어(TODO/FIXME) 0 |
| `docs/design-notes/**` | 디자인팀 | 레퍼런스 출처 명시, 바이너리 이미지 미포함 |

## 커밋 규약

- **팀장만** `git commit` 실행. main 직접 (기능 브랜치/PR 없음).
- 메시지는 한국어 Conventional Commits:
  - `docs(plan)`, `docs(design)`, `docs(audit)`
  - `feat(ui)`, `feat(web)`, `feat(api)`
  - `test(web)`, `test(integration)`, `test(ui)`
  - `fix(...)`, `refactor(...)`, `chore(...)`
- 한 팀의 작업 = 한 커밋. 기능 단위로 분할.
- 팀장 PASS 전에는 커밋 금지.
- 팀장이 없는 메타 작업 (`.claude/**`, `CLAUDE.md`, 루트 설정 변경) 은 메인이 직접 커밋.
- Co-Authored-By trailer 항상 포함.

## 실패 루프 규약

- 팀장 FAIL 리턴 → 메인이 해당 팀원 재호출 (lead 지적사항 전달).
- 재검수 FAIL → 재호출 반복. **최대 3회**.
- 초과 시 사용자 보고 + 중단.

## 원칙

- `build` 성공 ≠ `dev` 성공 ≠ **UX 성공**. 세 레이어 중 변경 범위에 해당하는 것 모두 검증.
- 검증 단계 생략 시 **명시적으로 보고**. 말없이 넘기지 말 것.
- 이전 위반 사례:
  1. build 만 보고 dev 에러 방치
  2. HTTP 200 만 보고 "버튼 클릭/입력 동작" 미검증
  3. 스펙에 "native 사용" 명시라고 `ui-composer` 호출을 건너뛰고 바로 native (스펙은 UI 종류만, 라이브러리는 구현 단계 결정)
  4. Tailwind `@layer` cascade 모른 채 unlayered SCSS 로 작성 → base preflight 에 덮어써짐

## 금지사항

- 팀장이 Edit/Write/Task 사용.
- 팀원이 다른 에이전트 호출 (Task nesting).
- 메인이 팀장 검수 없이 커밋.
- Flyway `V1__init.sql` 수정. 새 버전은 `V<N+1>` 로. (예외: DB 엔진 자체를 교체하는 `docs/tech-stack/backend.md` 결정이 선행된 경우에 한해 V1~V<N> 을 새 엔진 문법으로 재작성 가능. 재작성 이후 시점부터 다시 불변.)
- 앱 코드 내부에 범용 UI primitive 생성.
- **모드 불일치 작업** — `docs/tech-stack/backend.md` 의 `mode` 가 `mock` 인데 `apps/example-api/**` 편집, `external` 인데 `swagger.json` 없이 `libs/api-types` 수작업 편집 같은 것. 모드 변경은 위 "모드 전환 체크리스트" 를 선행하고 반영.
- **`external` / `mock` 모드에서 `tests/integration/**` 를 실행**. 스펙 파일은 남겨둘 수 있지만 CI/로컬 실행 대상 아님.
- **`mock` 모드에서 프로덕션 번들에 MSW 포함**. `worker.start()` 는 반드시 `import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'` 같은 dev-only 조건부로.
