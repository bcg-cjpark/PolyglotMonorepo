---
description: 템플릿 레포를 실제 프로젝트로 초기화. 이름/패키지 치환, example 문서 정리. Fork/Use-template 직후 한 번만 실행.
---

# /bootstrap — 템플릿 초기화 스킬

이 레포를 **새 프로젝트로 전환**한다. 한 번만 실행.

## 1. 중복 실행 방지 체크

아래 중 하나라도 이미 변경되어 있으면 "이미 bootstrap 된 것 같은데 계속 진행하시겠습니까?" 확인 후 진행:
- `apps/example-api/settings.gradle.kts` 에 `rootProject.name = "example-api"` 가 **없음**
- `com.example.template` 문자열이 `Kotlin 소스 중 하나에도 없음`
- `docs/prd/user-management.md` 파일이 없음

Bash 체크:
```bash
grep -q 'rootProject.name = "example-api"' apps/example-api/settings.gradle.kts && \
  echo "템플릿 상태" || echo "이미 변경됨"
```

## 2. 사용자 입력 수집 (AskUserQuestion)

반드시 다음 값을 수집. 기본값 제안하되 사용자가 지정 가능:

| 항목 | 예시 | 검증 |
|---|---|---|
| **프로젝트 슬러그** | `billing-app` | kebab-case, 3-40자 |
| **Kotlin 루트 패키지** | `com.acme.billing` | 소문자 + 점, 역도메인 |
| **프로덕트 한 줄 소개** | `송장 관리 SaaS` | README 에 들어감 |
| **색상 커스터마이즈 여부** | `yes` / `no` | `no` 면 템플릿 기본 팔레트(아래) 사용, `yes` 면 Primary/Secondary HEX 추가 수집 |
| **Primary 색상** (yes 일 때) | `#2563eb` | `#rrggbb` 또는 `#rgb` |
| **Secondary 색상** (yes 일 때) | `#f97316` | `#rrggbb` 또는 `#rgb` |

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
  API 앱 이름:     example-api            →  billing-api
  Web 앱 이름:     example-web            →  billing-web
  Gradle 경로:     com/example/template/  →  com/acme/billing/
  README:          템플릿 설명            →  송장 관리 SaaS

추가로:
  - docs/prd/user-management.md 제거
  - docs/screens/user-*.md 제거
  - apps/example-api/app/src/test/...ApplicationTests.kt 의 패키지 라인 업데이트
  - libs/api-types 기존 OpenAPI 코드젠 결과 초기화
  - pnpm-workspace.yaml, nx.json 의 참조 업데이트
  - 디자인 시스템 색상 재생성 (항상 실행):
      node scripts/apply-theme-colors.mjs --primary=<primary> --secondary=<secondary>
      ↑ 커스터마이즈 미선택 시 BOOTSTRAP_DEFAULTS (#4f46e5 / #f59e0b) 사용

진행할까요? (yes/no)
```

## 3. 치환 실행

### 3.1 Kotlin 소스 패키지 이동
```bash
# 디렉토리 구조 변경
OLD_PKG_PATH=com/example/template
NEW_PKG_PATH=$(echo "com.acme.billing" | tr '.' '/')

find apps/example-api -type d -path "*/$OLD_PKG_PATH" | while read d; do
  parent=$(dirname "$d")
  new_d="$parent/$NEW_PKG_PATH"
  mkdir -p "$(dirname "$new_d")"
  mv "$d" "$new_d"
done

# 빈 com/example 디렉토리 정리
find apps/example-api -type d -empty -delete
```

### 3.2 파일 내용 치환 (Kotlin/resources/Gradle)

```bash
# com.example.template → com.acme.billing (Kotlin, YAML, SQL, Gradle 모두)
find apps/example-api -type f \( -name "*.kt" -o -name "*.kts" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sql" -o -name "*.gradle" \) \
  -exec sed -i 's|com\.example\.template|com.acme.billing|g' {} +

# rootProject.name 변경
sed -i 's|rootProject.name = "example-api"|rootProject.name = "billing-api"|' \
  apps/example-api/settings.gradle.kts
```

### 3.3 앱 디렉토리 이름 변경 (선택 — 사용자가 원할 때만)

**주의:** `example-*` → `<slug>-*` 로 바꾸려면 apps/ 하위 디렉토리 rename + 여러 파일에서 참조 업데이트 필요. 현재 영향 파일:
- `apps/<name>/project.json` (name 필드)
- `apps/<name>/package.json` (name 필드)
- `nx.json` 참조
- `pnpm-workspace.yaml` (이미 `apps/*` 와일드카드라 수정 불필요)
- `playwright.config.ts` webServer 경로
- `libs/api-types/package.json` codegen 스크립트의 경로
- `scripts/vite-ui-consumer.mjs` 참조
- `tools/generators/*/generator.ts` 의 source 경로
- `.claude/agents/*` 안의 참조들 (`example-api`, `example-web` 언급)

이 리네임은 범위가 넓어서, **일단 디렉토리명은 `example-*` 유지** 하고 `project.json`/`package.json` 의 `name` 필드만 바꾸는 것을 제안. 에이전트가 사용자에게 확인:
```
앱 디렉토리명도 billing-api / billing-web 으로 바꾸시겠어요?
(아니오 선택 시: 디렉토리는 example-* 유지, 내부 표시 이름만 변경)
```

### 3.4 문서 정리
```bash
rm docs/prd/user-management.md
rm docs/screens/user-list.md
rm docs/screens/user-form.md
```

### 3.5 README 교체
`README.md` 를 사용자 프로젝트용으로 교체:
```markdown
# {프로젝트 슬러그}

{프로덕트 한 줄 소개}

## 개발 시작

1. `docs/prd/` 에 기획서 추가
2. `docs/screens/` 에 화면정의서 추가
3. Claude 에 "docs/prd/<파일> 기반으로 개발 시작해줘" 요청

## 명령어

- `pnpm nx run example-web:dev` — 프론트엔드 개발 서버
- `pnpm nx run example-api:serve` — 백엔드 Spring Boot
- `pnpm nx run example-web:e2e` — Playwright e2e

## 기반 템플릿

이 레포는 [PolyglotMonorepo](https://github.com/your-org/polyglot-monorepo)
템플릿에서 생성됨. 구조/컨벤션/에이전트는 그대로 유지. 변경 전 CLAUDE.md 확인.
```

### 3.6 CLAUDE.md 간단 정리

상단에 "이 레포는 `PolyglotMonorepo` 템플릿에서 생성된 `<slug>` 프로젝트" 한 줄 추가.
기존 내용은 **유지** (검증 규칙, UI 라이브러리 우선 등은 계속 적용되어야 함).

### 3.7 디자인 시스템 색상 (항상 실행)

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
> 두 경우 모두 Secondary 를 항상 세팅한다 (템플릿 레포에는 Secondary 가 아직 없으므로 최초 bootstrap 시 새로 추가되는 경로).

스크립트 동작:
- `libs/tokens/styles/__tokens-light.css` 와 `__tokens-dark.css` 의
  `--base-colors-primary-primary*` (및 secondary) 전 단계(050~900 + deep) 를
  HSL 기반으로 재생성. Light/Dark 양 테마 모두 갱신.
- Secondary 가 처음 추가되면 `libs/tokens/styles/tailwind-bridge.css` 에
  `--color-secondary` alias 를 함께 추가.

## 4. 검증

다음 명령이 에러 없이 끝나야 함:

```bash
# Kotlin 컴파일 OK?
cd apps/example-api && node ../../scripts/run-gradle.mjs :app:compileKotlin
# ↑ 변경된 패키지로 컴파일되는지 확인

# 의존성 재설치 (명칭 변경 반영)
cd ../.. && pnpm install

# 프론트엔드 빌드 OK?
pnpm nx run example-web:build

# Lint OK?
pnpm nx run example-api:lint
```

## 5. 정리 및 완료 보고

```
✓ bootstrap 완료.

변경 요약:
  - Kotlin 패키지: com.acme.billing
  - API 이름: billing-api
  - Web 이름: billing-web
  - docs/ 예시 문서 제거
  - README 교체

다음 단계:
  1. docs/prd/<기능명>.md 작성 (docs/prd/README.md 포맷 참고)
  2. docs/screens/<화면명>.md 작성 (docs/screens/README.md 포맷 참고)
  3. "docs/prd/<파일> 기반으로 개발 시작해줘" 라고 Claude 에 요청
     → prd-analyzer 에이전트가 파싱 → developer 에이전트가 코드 생성

초기 commit 을 만들어 두시려면:
  git add -A && git commit -m "chore: bootstrap from polyglot-monorepo template"
```

## 6. 자기 정리 (선택)

사용자가 원하면 이 스킬 파일 자체를 제거해서 재실행 방지:
```bash
rm .claude/commands/bootstrap.md
```
(자동으로 지우지 말 것 — 사용자 확인 필수)

## 절대 하지 말 것

- **`.claude/agents/*` 파일 내용 수정** — 이 에이전트들은 템플릿 자산. 경로 참조(`example-api` 등)만 필요 시 업데이트.
- **`libs/ui`, `libs/tailwind-config`, `libs/typescript-config`, `libs/eslint-config` 변경** — 공통 인프라 유지.
- **`libs/tokens/styles/__tokens-*.css` 를 직접 편집** — 색상 변경은 반드시 `scripts/apply-theme-colors.mjs` 로. 직접 편집하면 Light/Dark 동기화가 깨지기 쉬움.
- **`tools/generators/` 수정** — 제너레이터도 템플릿 자산.
- **git 상태 무시** — 기존 uncommitted 변경이 있으면 사용자에게 확인 후 진행.
- **외부 네트워크 호출** — 이 스킬은 로컬에서만 동작.
