## UI 라이브러리 우선 규칙

**새 UI가 필요하면 ad-hoc 컴포넌트를 만들지 말고 `@monorepo/ui` 를 먼저 활용할 것.**

바이브 코딩 시 매번 다른 스타일의 컴포넌트가 튀어나오면 일관성이 깨짐. 따라서:

1. **먼저 `libs/ui/src/components/` 탐색** — 이미 있는 컴포넌트(Button, Input, Card, Modal 등 28+)로 요구사항이 충족 가능한가?
2. **없으면 `ui-lead` 에이전트에 위임** (`.claude/agents/ui/ui-lead.md`). ui-lead 가 내부에서 `ui-composer` 를 호출해 `libs/ui` 에 새 primitive 를 추가한 뒤, `ui-design-reviewer` + `ui-verifier` 로 일관성/동작 검증까지 완료한다.
3. **앱 코드 내부에 인라인 컴포넌트를 만들지 말 것** (예: `apps/example-web/src/components/MyButton.tsx` 같은 것 금지). 재사용 가능한 것은 전부 `libs/ui` 에.

**예외:** 해당 페이지에서만 쓰이는 **합성 컴포넌트**(예: `UserListRow` 같은 페이지 로컬 구성)는 `apps/*/src/components/` 에 둘 수 있음. 단, 그것도 내부 구성은 `@monorepo/ui` 의 primitive 로.

**직접 호출 금지:** `ui-composer`, `ui-verifier`, `ui-design-reviewer` 는 `ui-lead` 가 내부에서만 호출. 메인/developer 가 이 세 가지를 직접 호출하지 말 것 (단일 진입점 원칙). 사용자가 명시적으로 "composer만 돌려" 같이 지시한 경우만 예외.

## 작업 검증 규칙

**어떤 작업이든 완료 보고 전에 반드시 관련된 빌드/실행/UX 검증을 돌려볼 것.**
"동작할 것이다"로 끝내지 말고 실제로 돌려본 결과를 근거로 보고.

### 계층별 검증 수단

| 변경 계층 | 필수 검증 |
|---|---|
| Kotlin (`apps/example-api/`) | `pnpm nx run example-api:lint` (구조 변경 시 `:build` 또는 `:serve` 도 실기동) |
| Gradle 설정 | 최소 `:lint` 실행으로 문법/의존성 확인 |
| React 컴포넌트/페이지/라우트/서비스 (`apps/example-web/src/`, `libs/ui/src/`) | `build` + **`ui-lead` 에이전트 호출** (ui-lead 내부에서 design-reviewer + Playwright verifier 돌림) |
| CSS/토큰/Tailwind 설정 | dev 서버에서 transform 확인 **+** UX 변화 있으면 `ui-lead` 호출 |
| `libs/tokens/styles/__tokens-*.css` 색상 변경 | 반드시 `node scripts/apply-theme-colors.mjs --primary=<hex> [--secondary=<hex>]` 경유. 직접 편집 금지 (Light/Dark 동기화 깨짐). |

### UX/디자인 검증 시 Task 도구로 `ui-lead` 호출 필수

React 쪽 변경 후 **브라우저에서 실제로 동작하는지** + **디자인 시스템 일관성** 은
HTTP/빌드 검증만으로는 알 수 없음. `ui-lead` 에이전트(`.claude/agents/ui/ui-lead.md`)가
내부에서:
- `ui-design-reviewer` — 하드코딩 색/간격/라이브러리 일탈 감사
- `ui-verifier` — Playwright 로 실제 키보드/마우스 이벤트 검증
- 위반 있으면 `ui-composer` / `developer` 로 수정 요청 후 재검토 (최대 3회)

까지 모두 돌려서 PASS/FAIL 리포트를 반환.

**호출 예시:**
> React UserFormPage 수정 끝. Task 도구로 ui-lead 에이전트 호출해서
> "Name/Email 입력 타이핑, Create 버튼 제출, 생성된 유저가 리스트에 나타나는지
> 검증 + 디자인 일관성 감사" 요청.

**`ui-lead` 를 건너뛰어도 되는 경우:**
- 백엔드만 수정 (Kotlin, SQL)
- 문서/주석만 변경
- `.claude/`, CI 등 설정 파일만 수정

### 원칙

- `build` 성공 ≠ `dev` 성공 ≠ **UX 성공**. 세 레이어 중 변경 범위에 해당하는 것 모두 검증.
- 검증 단계가 길어서 생략해야 하면 **명시적으로 보고**. 말없이 넘기지 말 것.
- 이전 위반 사례: (1) build만 보고 dev 에러 방치, (2) HTTP 200만 보고 "버튼 클릭/입력 동작" 미검증, (3) 스펙에 "native 사용" 명시로 `ui-composer` 호출을 건너뛰고 바로 native 로 감 (스펙은 UI 종류만, 라이브러리는 구현 단계 결정).

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
