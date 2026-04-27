# Polyglot Monorepo

Kotlin + React 폴리글랏 모노레포 템플릿.  
실무 프로젝트 scaffold용. Nx로 빌드/캐싱/영향도 분석을 통합 관리합니다.

## 템플릿으로 사용하기

이 레포는 GitHub **template repository** 입니다. 클론해서 그대로 쓰는 게 아니라, **새 레포를 떠서 `/bootstrap` 으로 초기화**하는 흐름입니다.

1. GitHub 페이지 상단의 **"Use this template" → "Create a new repository"** 클릭 (또는 fork)
2. 생성된 레포를 클론하고 의존성 설치
   ```bash
   git clone <your-new-repo>
   cd <your-new-repo>
   pnpm install
   cp .env.example .env
   ```
3. **Claude Code 에서 `/bootstrap` 실행** — 한 번만. 다음을 자동 처리합니다:
   - 프로젝트 슬러그 / Kotlin 루트 패키지 입력 받기
   - `com.example.template` → `com.<your-org>.<project>` 일괄 치환
   - `example-api` / `example-web` 표시 이름 갱신 (디렉토리명은 선택)
   - 예시 문서(`docs/prd/user-management.md`, `docs/screens/user-*.md`) 제거
   - 테마 색상 재생성 (`scripts/apply-theme-colors.mjs` 경유 — 토큰 직접 편집 금지)
   - README 를 새 프로젝트용으로 교체
4. 첫 커밋
   ```bash
   git add -A && git commit -m "chore: bootstrap from polyglot-monorepo template"
   ```

이후 개발은 `docs/prd/<feature>.md` + `docs/screens/<page>.md` 를 작성하고 Claude 에 *"docs/prd/<파일> 기반으로 개발 시작해줘"* 라고 요청하면, [에이전트 파이프라인](./.claude/agents/README.md)이 기획 → UI → 프론트 → 테스트까지 진행합니다.

> **컨벤션 / 팀 규약 / 모드(`inhouse` · `external` · `mock`) 운영 규칙**: [`CLAUDE.md`](./CLAUDE.md)
> **릴리즈 변경 이력**: [`CHANGELOG.md`](./CHANGELOG.md)

---

## Structure

```
apps/
  example-api/          Kotlin · Spring Boot 3 · Gradle multi-module (domain ← security ← app)
  example-web/          React · Vite · TypeScript
libs/
  api-types/            OpenAPI → TypeScript 자동 생성 타입
tools/
  generators/           Nx 커스텀 제너레이터 (api-app, web-app)
```

## Prerequisites

- Node 20+, pnpm 10+
- Java 21+

## Setup

```bash
pnpm install
cp .env.example .env
```

## Dev

> `nx`가 전역 PATH에 없다면 `pnpm nx ...` 또는 `pnpm exec nx ...`로 실행하세요.
> `package.json` scripts(`pnpm build`, `pnpm test`, `pnpm graph` 등)도 활용 가능합니다.

```bash
# 백엔드 실행 (H2 로컬 프로필)
pnpm nx run example-api:serve                # → ./gradlew :app:bootRun

# 프론트엔드 실행
pnpm nx run example-web:dev                  # → vite, port 3000

# 전체 빌드
pnpm nx run-many -t build                    # 또는 pnpm build

# 변경된 것만 (CI용)
pnpm nx affected -t build,test,lint

# 의존성 그래프
pnpm nx graph                                # 또는 pnpm graph
```

## OpenAPI 타입 공유

```bash
# 1. 백엔드에서 OpenAPI spec 추출
pnpm nx run example-api:generate-openapi     # → app/build/openapi.json

# 2. TypeScript 타입 생성
pnpm nx run api-types:codegen                # → libs/api-types/src/generated.ts

# 3. 프론트엔드에서 import
#    import type { components } from "@monorepo/api-types";
```

## 새 앱 생성

```bash
# Kotlin API
pnpm nx g @monorepo/generators:api-app billing-api \
    --packageName=com.acme.billing

# React Web
pnpm nx g @monorepo/generators:web-app admin-web
```

## 주요 커맨드 요약

| 명령 | 설명 |
|---|---|
| `pnpm install` | 워크스페이스 의존성 설치 |
| `pnpm nx graph` | 프로젝트 의존성 그래프 시각화 |
| `pnpm nx run <proj>:<target>` | 특정 타깃 실행 |
| `pnpm nx run-many -t build` | 모든 프로젝트 빌드 |
| `pnpm nx affected -t build` | 변경 영향 프로젝트만 빌드 |
| `pnpm build` / `pnpm test` / `pnpm lint` | 전체 빌드/테스트/린트 (package.json scripts) |

## 패키지 네임스페이스

Kotlin: `com.example.template.*` — 새 앱 생성 시 제너레이터가 자동 치환  
TypeScript: `@monorepo/*` — workspace path aliases

## 참고

- Nx + Gradle 공식 플러그인: https://nx.dev/docs/technologies/java/gradle/introduction
- springdoc-openapi: https://springdoc.org
- openapi-typescript: https://openapi-ts.dev
