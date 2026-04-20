# Polyglot Monorepo

Kotlin + React 폴리글랏 모노레포 템플릿.  
실무 프로젝트 scaffold용. Nx로 빌드/캐싱/영향도 분석을 통합 관리합니다.

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
