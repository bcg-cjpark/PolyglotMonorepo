---
description: 템플릿 레포를 실제 프로젝트로 초기화. Kotlin 패키지 치환, 색상 재생성, 템플릿 릴리즈 흔적 정리. Fork/Use-template 직후 한 번만 실행.
---

# /bootstrap — 템플릿 초기화 스킬

이 레포를 **새 프로젝트로 전환**한다. 한 번만 실행.

> **디렉토리명 정책**: 이 템플릿은 의도적으로 `apps/api/`, `apps/web/` 라는 **역할 기반 generic 이름** 을 사용한다 (v2.0.0 부터). bootstrap 은 디렉토리 rename 을 하지 않는다 — 추가 앱이 필요하면 `nx g @monorepo/generators:api-app billing-api` / `web-app admin-web` 으로 specific 이름의 새 앱을 추가한다.

## 1. 중복 실행 방지 체크

bootstrap 이 이미 실행되었는지 판정. 아래 중 하나라도 충족하면 "이미 bootstrap 된 것 같은데 계속 진행하시겠습니까?" 확인 후 진행:
- `com.example.template` 문자열이 `apps/api/**/*.kt` 어디에도 **없음** (가장 강력한 신호 — bootstrap 이 이걸 지운다)
- `CHANGELOG.md` 의 `## [Unreleased]` 섹션 **아래에** 다른 버전 헤더가 없음 (= 비어 있음)

Bash 체크:
```bash
grep -rq 'com\.example\.template' apps/api/app/src/main/kotlin && \
  echo "템플릿 상태" || echo "이미 bootstrap 된 것으로 보임"
```

## 2. 사용자 입력 수집 (AskUserQuestion)

반드시 다음 값을 수집. 기본값 제안하되 사용자가 지정 가능:

| 항목 | 예시 | 검증 |
|---|---|---|
| **프로젝트 슬러그** | `billing-app` | kebab-case, 3-40자 (README 제목과 GitHub repo 이름에 들어감) |
| **Kotlin 루트 패키지** | `com.acme.billing` | 소문자 + 점, 역도메인 |
| **프로덕트 한 줄 소개** | `송장 관리 SaaS` | README 에 들어감 |
| **색상 커스터마이즈 여부** | `yes` / `no` | `no` 면 템플릿 기본 팔레트(아래) 사용, `yes` 면 Primary/Secondary HEX 추가 수집 |
| **Primary 색상** (yes 일 때) | `#2563eb` | `#rrggbb` 또는 `#rgb` |
| **Secondary 색상** (yes 일 때) | `#f97316` | `#rrggbb` 또는 `#rgb` |

> **Nx project / 디렉토리 이름은 묻지 않는다.** `apps/api`, `apps/web` 은 *역할 이름* 으로 고정. 사용자의 프로젝트는 외부 네이밍(repo 명, README 제목, Kotlin 패키지) 에서 표현된다.

### 템플릿 기본 팔레트 (BOOTSTRAP_DEFAULTS)

사용자가 색상 커스터마이즈 `no` 를 선택하거나 답을 비우면 **아래 HEX 를 그대로 `scripts/apply-theme-colors.mjs` 에 전달**한다. 근거는 `docs/design-notes/global-palette.md` 의 `BOOTSTRAP_DEFAULTS` 섹션 (디자인팀이 결정).

| 역할 | HEX |
|---|---|
| Primary   | `#4f46e5` (indigo-600) |
| Secondary | `#f59e0b` (amber-500) |

> **주의**: 이 HEX 가 바뀔 때는 `docs/design-notes/global-palette.md` 의 `BOOTSTRAP_DEFAULTS` 표와 **동기화**. 디자인팀이 노트를 갱신하면 이 스킬도 함께 업데이트.

수집 후 아래 치환 계획을 **사용자에게 보여주고 확인**:

```
다음 변경을 진행합니다:
  Kotlin 패키지:   com.example.template  →  com.acme.billing
  Gradle 경로:     com/example/template/  →  com/acme/billing/
  README:          템플릿 설명            →  송장 관리 SaaS (프로젝트: billing-app)
  CHANGELOG:       템플릿 v1.x.x 이력     →  빈 [Unreleased] 셸 (사용자 프로젝트 0.1.0 부터 새로 시작)
  docs/releases/:  템플릿 릴리즈 노트     →  제거 (사용자 프로젝트는 자기 릴리즈만 추가)
  디자인 색상:     BOOTSTRAP_DEFAULTS or 입력 HEX 로 토큰 재생성

유지:
  - apps/api/, apps/web/ 디렉토리명 (역할 이름)
  - .claude/agents/**, libs/** (템플릿 자산)
  - docs/prd|screens|stitch-brief|audit/README.md (스펙 작성 가이드)
  - docs/design-notes/global-*.md, data-display.md (디자인 시스템 공통 노트)

진행할까요? (yes/no)
```

## 3. 치환 실행

### 3.1 Kotlin 소스 패키지 이동
```bash
# 디렉토리 구조 변경
OLD_PKG_PATH=com/example/template
NEW_PKG_PATH=$(echo "com.acme.billing" | tr '.' '/')

find apps/api -type d -path "*/$OLD_PKG_PATH" | while read d; do
  parent=$(dirname "$d")
  new_d="$parent/$NEW_PKG_PATH"
  mkdir -p "$(dirname "$new_d")"
  mv "$d" "$new_d"
done

# 빈 com/example 디렉토리 정리
find apps/api -type d -empty -delete
```

### 3.2 파일 내용 치환 (Kotlin / resources / Gradle)

```bash
# com.example.template → com.acme.billing (Kotlin, YAML, SQL, Gradle 모두)
find apps/api -type f \( -name "*.kt" -o -name "*.kts" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sql" -o -name "*.gradle" \) \
  -exec sed -i 's|com\.example\.template|com.acme.billing|g' {} +
```

> `rootProject.name`, Spring `application.name`, Nx project name 은 **건드리지 않는다** — 모두 `api`/`web` 으로 고정 (역할 이름).

### 3.3 템플릿 릴리즈 흔적 리셋

사용자 프로젝트는 자기 변경 이력을 새로 시작해야 하므로, 템플릿이 누적해 둔 릴리즈 산출물을 비운다.

```bash
# 템플릿이 자기 자신의 변경을 기록한 릴리즈 노트 제거
rm -f docs/releases/v*.md

# CHANGELOG 를 빈 Keep-a-Changelog 셸로 리셋
cat > CHANGELOG.md <<'EOF'
# Changelog

이 프로젝트의 모든 주목할 만한 변경사항을 기록합니다.

포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 1.1.0 을 따르며,
SemVer 는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html) 2.0.0 에 따릅니다.

## [Unreleased]
EOF
```

### 3.4 README 교체

`README.md` 를 사용자 프로젝트용으로 교체:
```markdown
# {프로젝트 슬러그}

{프로덕트 한 줄 소개}

## 개발 시작

1. `docs/prd/` 에 기획서 추가 (`docs/prd/README.md` 포맷 참고)
2. `docs/screens/` 에 화면정의서 추가 (`docs/screens/README.md` 포맷 참고)
3. Claude 에 "docs/prd/<파일> 기반으로 개발 시작해줘" 요청

## 명령어

- `pnpm nx run web:dev` — 프론트엔드 개발 서버 (Vite, port 3000)
- `pnpm nx run api:serve` — 백엔드 Spring Boot (port 8080)
- `pnpm nx run web:e2e` — Playwright e2e
- `pnpm nx run-many -t build` — 전체 빌드

## 추가 앱 생성

```bash
pnpm nx g @monorepo/generators:api-app billing-api --packageName=com.acme.billing
pnpm nx g @monorepo/generators:web-app admin-web
```

## 기반 템플릿

이 레포는 [PolyglotMonorepo](https://github.com/your-org/polyglot-monorepo)
템플릿에서 생성됨. 구조/컨벤션/에이전트는 그대로 유지. 변경 전 CLAUDE.md 확인.
```

### 3.5 CLAUDE.md 간단 정리

상단에 "이 레포는 `PolyglotMonorepo` 템플릿에서 생성된 `<slug>` 프로젝트" 한 줄 추가.
기존 내용은 **유지** (검증 규칙, UI 라이브러리 우선 등은 계속 적용되어야 함).

### 3.6 디자인 시스템 색상 (항상 실행)

토큰 파일을 직접 편집하지 말 것. 반드시 generator 경유.

**사용자가 커스터마이즈 `yes` 선택한 경우** — 입력받은 HEX 사용:
```bash
node scripts/apply-theme-colors.mjs --primary=<primary_hex> --secondary=<secondary_hex>
```

**사용자가 커스터마이즈 `no` 선택한 경우** — 템플릿 기본 팔레트(BOOTSTRAP_DEFAULTS) 사용:
```bash
node scripts/apply-theme-colors.mjs --primary=#4f46e5 --secondary=#f59e0b
```

> 기본값 근거는 `docs/design-notes/global-palette.md` 의 `BOOTSTRAP_DEFAULTS` 표 참조.

스크립트 동작:
- `libs/tokens/styles/__tokens-light.css` 와 `__tokens-dark.css` 의
  `--base-colors-primary-primary*` (및 secondary) 전 단계(050~900 + deep) 를
  HSL 기반으로 재생성. Light/Dark 양 테마 모두 갱신.
- `--color-secondary` Tailwind alias 는 `libs/tailwind-config/globals.css` 에
  static 으로 이미 정의되어 있어 스크립트가 별도로 주입하지 않음.

## 4. 검증

다음 명령이 에러 없이 끝나야 함:

```bash
# 의존성 재설치 (혹시 모를 정합성 문제 방지)
pnpm install

# Kotlin 컴파일 OK? (변경된 패키지로 컴파일되는지)
pnpm nx run api:build

# 프론트엔드 빌드 OK?
pnpm nx run web:build

# Lint OK?
pnpm nx run api:lint
pnpm nx run web:lint
```

## 5. 정리 및 완료 보고

```
✓ bootstrap 완료.

변경 요약:
  - Kotlin 패키지: com.acme.billing (apps/api 안)
  - 템플릿 CHANGELOG/릴리즈 노트 리셋 → 사용자 프로젝트의 첫 릴리즈부터 새로 누적
  - 디자인 토큰 색상 재생성 (Primary/Secondary)
  - README 교체 (프로젝트명/소개/명령어/추가 앱 생성 안내)

유지된 자산:
  - apps/api/, apps/web/ 셸 코드 (Spring Boot multi-module + React + Vite)
  - .claude/agents/** (에이전트 파이프라인)
  - libs/ui, libs/tokens, libs/tailwind-config 등 디자인 시스템

다음 단계:
  1. docs/prd/<기능명>.md 작성 (docs/prd/README.md 포맷 참고)
  2. docs/screens/<화면명>.md 작성 (docs/screens/README.md 포맷 참고)
  3. "docs/prd/<파일> 기반으로 개발 시작해줘" 라고 Claude 에 요청
     → doc-consolidator 가 PRD 정리 → 백/프론트/UI 팀이 코드 생성

초기 commit:
  git add -A && git commit -m "chore: bootstrap from polyglot-monorepo template"
```

## 6. 자기 정리 (선택)

사용자가 원하면 이 스킬 파일 자체를 제거해서 재실행 방지:
```bash
rm .claude/commands/bootstrap.md
```
(자동으로 지우지 말 것 — 사용자 확인 필수)

## 절대 하지 말 것

- **`apps/api`, `apps/web` 디렉토리 rename** — v2.0.0 부터 generic 이름으로 고정. 추가 앱은 `nx g` 로 specific 이름 부여.
- **`.claude/agents/*` 파일 내용 수정** — 이 에이전트들은 템플릿 자산. 경로 참조도 `apps/api`/`apps/web` 가정.
- **`libs/ui`, `libs/tailwind-config`, `libs/typescript-config`, `libs/eslint-config` 변경** — 공통 인프라 유지.
- **`libs/tokens/styles/__tokens-*.css` 를 직접 편집** — 색상 변경은 반드시 `scripts/apply-theme-colors.mjs` 로. 직접 편집하면 Light/Dark 동기화가 깨지기 쉬움.
- **`tools/generators/` 수정** — 제너레이터도 템플릿 자산.
- **`docs/prd|screens|stitch-brief|audit/README.md` 삭제** — 스펙 작성 가이드. 사용자가 첫 PRD 쓸 때 참고해야 함.
- **`docs/design-notes/global-*.md`, `data-display.md` 삭제** — 디자인 시스템 공통 노트. 피처별 `*-variants.md` 는 사용자가 작성하면서 추가됨.
- **git 상태 무시** — 기존 uncommitted 변경이 있으면 사용자에게 확인 후 진행.
- **외부 네트워크 호출** — 이 스킬은 로컬에서만 동작.
