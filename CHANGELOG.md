# Changelog

이 레포의 주목할 만한 변경사항을 기록한다.

포맷은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 기반이며,
버전은 [Semantic Versioning](https://semver.org/) 을 따른다.

릴리즈별 상세 노트는 [`docs/releases/`](./docs/releases/) 에 있다.

---

## [Unreleased]

<!-- 다음 릴리즈까지의 변경사항이 여기 누적된다. release-curator 가 릴리즈 시점에
     이 섹션을 `## [X.Y.Z] - YYYY-MM-DD` 로 교체하고 새 [Unreleased] 블록을 추가. -->

---

## [1.0.0] - 2026-04-24

**첫 공식 릴리즈.** 템플릿 셸 + 7 팀 에이전트 파이프라인 + 3 피처(User/Todo/Memo) dogfooding 완주로 규약·primitive·에이전트가 실제 동작함을 입증한 뒤, 예제 도메인을 제거해 템플릿 사용자용 베이스 상태로 출고.

상세: [`docs/releases/v1.0.0.md`](./docs/releases/v1.0.0.md)

### Added
- **Nx + pnpm workspace** 모노레포 스캐폴드 + Kotlin Spring Boot 3 멀티모듈 백엔드 + React 19 / Vite / Tailwind v4 / Playwright 프론트.
- **7 팀 에이전트 조직** (`.claude/agents/**`): 기획 / 디자인 / UI / 프론트개발 / 프론트테스트 / 백엔드 / 통합테스트 + 각 팀장.
- **디자인 토큰 시스템** (`libs/tokens`) — Light/Dark `:root[data-theme="..."]` 스위칭 + `scripts/apply-theme-colors.mjs` 로 팔레트 재생성.
- **`@monorepo/ui`** — Headless UI 기반 primitive 전집 (Button/Input/Textarea/Modal/Table/List/Chip/Checkbox/RadioGroup/Skeleton 등) + Storybook + Playwright interaction 테스트.
- **공통 설정 라이브러리** — `@monorepo/{typescript,tailwind,eslint}-config`, `@monorepo/types`, `@monorepo/api-types` (openapi-typescript 자동 생성).
- **파이프라인 [2b] 시안 프로세스** — `screen-concepter` 에이전트로 페이지당 2~4 variant HTML + Level 1/2/3 비교 인덱스 + Light/Dark 토글.
- **프로젝트 모드 규약** (`inhouse` / `external` / `mock`) — `docs/tech-stack/backend.md` 헤더가 단일 진실 소스, 모드별 활성 팀 분기.
- **운영 체크리스트** (Flyway migration 추가 후 재기동 / SecurityConfig permitAll 병렬 / 신규 에이전트 세션 로드 제약).
- **Modal primitive 비동기 지원** — `onConfirm` / `onCancel` 둘 다 async/throw 수용. throw 시 close 보류로 서버 실패나 양보 경로 표현 가능.
- **Jackson PUT 전체 교체 강제** (`FAIL_ON_MISSING_CREATOR_PROPERTIES=true` + `@field:JsonProperty(required=true)`) — PUT 이 PATCH 처럼 동작하던 Kotlin 기본 설정 gap 방어.

### Changed
- Flyway / DB 엔진 **MySQL 8.4 LTS** 로 통일 (PostgreSQL 초기값에서 전환).
- `libs/ui` primitive 전부 `@layer components` 로 감싸 Tailwind v4 preflight cascade 보호.
- Storybook `preview.ts` 에 `data-theme` 주입 + Light/Dark 토글.

### Fixed
- 한글 IME 조합 중 입력 유실 (`Input`, `Textarea`, `ComboBox`).
- Tailwind v4 `@theme` 매핑을 단일 CSS graph 로 통합해 palette utility 복구.
- MySQL UUID 저장을 `CHAR(36)` + `@JdbcTypeCode(SqlTypes.CHAR)` 로 바인딩 (Hibernate 기본 BINARY(16) 매핑 우회).

### Removed
- dogfooding 사이클의 예제 도메인 (User/Todo/Memo) — 템플릿 사용자가 자기 피처로 교체하도록 셸 상태로 출고.

---

[Unreleased]: https://github.com/pcjin/PolyglotMonorepo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/pcjin/PolyglotMonorepo/releases/tag/v1.0.0
