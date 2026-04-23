# Agent Team Map

이 레포의 에이전트는 **실제 프로덕트 개발 팀 구조** 를 본뜬다. 메인 에이전트가 프로젝트 전체 팀장 역할로 6개 서브팀을 순차 호출해 "기획 → (Stitch) → 디자인 → 개발(백/프론트) → 테스트 → 통합테스트 → 감사" 파이프라인을 돌린다.

## 플랫폼 제약 (중요)

Claude Code 는 **sub-agent nesting 을 지원하지 않는다** — 서브에이전트가 다른 서브에이전트를 Task 로 호출 불가. 따라서:

- **팀장 에이전트 (`*-lead.md`)**: 위임 대신 **검수 + 커밋** 담당. tools 는 `Read, Glob, Grep, Bash` 만 (Edit/Write/Task 없음).
- **팀원 에이전트**: 실제 파일 편집 담당. Task 도구 없음 — 다른 에이전트 호출 불가.
- **메인 에이전트 (= 프로젝트 전체 팀장)**: 모든 에이전트 호출 + 순서 조율.

## 팀 구조

```
.claude/agents/
├── README.md                  ← 여기
│
├── planning/                  ① 기획팀
│   ├── planning-lead.md
│   ├── doc-consolidator.md    — 산재 문서 → 단일 PRD
│   ├── stitch-brief-writer.md — Stitch 투입 스펙 작성
│   └── spec-auditor.md        — 구현 vs 문서 감사
│
├── frontend/                  ② 프론트엔드 대분류
│   ├── design/                ②-1 디자인팀
│   │   ├── design-lead.md
│   │   ├── design-trend-scout.md           — 트렌드/레퍼런스 수집
│   │   ├── screen-concepter.md             — Stitch 대안, 화면 시안 2~4개 카탈로그
│   │   └── design-consistency-auditor.md   — 토큰/스케일 감사
│   │
│   ├── ui/                    ②-2 UI팀 (libs/ui 소유)
│   │   ├── ui-lead.md
│   │   ├── ui-composer.md                  — primitive 추가/수정
│   │   ├── ui-storybook-curator.md         — stories 관리
│   │   └── ui-library-tester.md            — libs/ui 런타임 검증
│   │
│   ├── web/                   ②-3 프론트 개발팀
│   │   ├── frontend-lead.md
│   │   └── frontend-developer.md           — 페이지/서비스/라우트
│   │
│   └── test/                  ②-4 프론트 테스트팀
│       ├── frontend-test-lead.md
│       └── frontend-e2e-tester.md          — 화면 단위 Playwright
│
├── backend/                   ③ 백엔드 개발팀
│   ├── backend-lead.md
│   └── backend-developer.md                — Kotlin 도메인/API
│
└── integration/               ④ 통합테스트팀
    ├── integration-lead.md
    └── integration-e2e-runner.md           — 백+프론트 합류 e2e
```

## 파이프라인 (표준)

```
[1] 기획 통합       doc-consolidator → stitch-brief-writer → planning-lead (커밋)
[2] 화면정의서 획득 두 경로 중 하나:
    [2a] Stitch 수동 — 사용자가 툴 실행 → docs/screens/*.md 로 투입
    [2b] 시안 프로세스 — screen-concepter → variants.md → 사용자 선택
                     → 메인이 docs/screens/*.md 로 승격 (대행)
[3] 디자인 노트     design-trend-scout → design-lead (커밋)          ← 선택
[4] 백엔드 ∥ UI    backend-developer → backend-lead (커밋)
                   ui-composer → ui-storybook-curator → ui-library-tester → ui-lead (커밋)
[5] 프론트 화면     frontend-developer → design-consistency-auditor → frontend-lead (커밋)
[6] 화면 e2e        frontend-e2e-tester → frontend-test-lead (커밋)
[7] 통합 e2e        integration-e2e-runner → integration-lead (커밋)
[8] 실패 루프       lead FAIL → 해당 팀원 재호출 (≤ 3회)
[9] 사후 감사       spec-auditor → planning-lead (커밋)
```

실패 루프 3회 초과 시 사용자에게 보고 + 중단.

## 파일 편집 소유권

| 경로 | 편집 가능 팀 |
|---|---|
| `docs/prd/**`, `docs/screens/**`, `docs/stitch-brief/**` | 기획팀 |
| `docs/design-notes/**` | 디자인팀 |
| `libs/ui/**` | UI팀 |
| `libs/tokens/styles/__tokens-*.css` | UI팀 (`scripts/apply-theme-colors.mjs` 경유 필수, 의도는 디자인팀) |
| `libs/tailwind-config/globals.css` (Tailwind `@theme inline` 매핑) | UI팀 |
| `apps/example-web/src/**` | 프론트 개발팀 |
| `apps/example-web/tests/e2e/**` | 프론트 테스트팀 |
| `apps/example-web/tests/integration/**` | 통합테스트팀 |
| `apps/example-api/**` | 백엔드팀 |
| `.claude/**`, `CLAUDE.md`, 루트 설정 | 메인(프로젝트 전체 팀장) |

## 커밋 규약

- **팀장만** `git commit` 실행. main 직접.
- 한국어 Conventional Commits:
  - `docs(plan)`, `docs(design)`, `docs(audit)`
  - `feat(ui)`, `feat(web)`, `feat(api)`
  - `test(web)`, `test(integration)`, `test(ui)`
  - `fix(...)`, `refactor(...)`, `chore(...)`
- 한 팀의 작업 = 한 커밋. 기능 단위로 분할.
- 팀장 PASS 전에는 커밋 금지.
- 팀장이 없는 메타 작업 (`.claude/**`, `CLAUDE.md`, 루트 설정) 은 메인이 직접 커밋.

## 호출 규약

메인 에이전트 관점:

1. 파이프라인 단계에 맞춰 **팀원 에이전트** 를 먼저 호출해 파일 변경.
2. 같은 팀의 **팀장 에이전트** 를 호출해 검수.
3. 팀장이 PASS 리턴 시 팀장이 `git commit` 직접 실행.
4. 팀장이 FAIL 리턴 시 지적사항을 팀원에게 전달해 재호출 (최대 3회).

## 금지사항

- 팀장이 Edit/Write/Task 사용.
- 팀원이 다른 에이전트 호출 (Task nesting).
- 메인이 팀장 검수 없이 커밋.
- Flyway `V1__init.sql` 수정. 새 버전은 `V<N+1>` 로.

## 더 읽기

- 프로젝트 전체 규약: [`CLAUDE.md`](../../CLAUDE.md)
- 기획 문서 포맷: [`docs/prd/README.md`](../../docs/prd/README.md)
- 화면정의서 포맷: [`docs/screens/README.md`](../../docs/screens/README.md)
