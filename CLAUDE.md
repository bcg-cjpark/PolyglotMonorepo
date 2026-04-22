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

## 표준 파이프라인

```
[1] 기획 통합       doc-consolidator → stitch-brief-writer → planning-lead (커밋)
[2] (사용자 수동)   Stitch 로 화면정의서 생성 → docs/screens/*.md 로 투입
[3] 디자인 노트     design-trend-scout → design-lead (커밋)          ← 선택
[4] 백엔드 ∥ UI    backend-developer → backend-lead (커밋)
                   ui-composer → ui-storybook-curator → ui-library-tester → ui-lead (커밋)
[5] 프론트 화면     frontend-developer → design-consistency-auditor → frontend-lead (커밋)
[6] 화면 e2e        frontend-e2e-tester → frontend-test-lead (커밋)
[7] 통합 e2e        integration-e2e-runner → integration-lead (커밋)
[8] 실패 루프       lead FAIL → 해당 팀원 재호출 (≤ 3회)
[9] 사후 감사       spec-auditor → planning-lead (커밋)
```

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
| `docs/prd/**`, `docs/screens/**`, `docs/stitch-brief/**`, `docs/audit/**` | 기획팀 |
| `docs/design-notes/**` | 디자인팀 |
| `libs/ui/**` | UI팀 |
| `libs/tokens/styles/__tokens-*.css` | UI팀 (`scripts/apply-theme-colors.mjs` 경유 필수, 의도 결정은 디자인팀) |
| `libs/tailwind-config/globals.css` (Tailwind `@theme inline` 매핑) | UI팀 |
| `apps/example-web/src/**` | 프론트 개발팀 |
| `apps/example-web/tests/e2e/**` | 프론트 테스트팀 |
| `apps/example-web/tests/integration/**` | 통합테스트팀 |
| `apps/example-api/**` | 백엔드팀 |
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
