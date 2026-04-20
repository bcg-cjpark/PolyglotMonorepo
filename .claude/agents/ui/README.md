# UI Agent Team

UI 관련 작업을 담당하는 에이전트 서브트리. **메인 에이전트(또는 `developer` 같은
상위 에이전트)는 UI 작업이 필요하면 무조건 `ui-lead` 하나만 호출**한다. 나머지
(`ui-composer`, `ui-design-reviewer`, `ui-verifier`) 는 `ui-lead` 가 내부에서
순차 위임하는 도구.

## 구성원

| 에이전트 | 역할 | 파일 수정 권한 |
|---|---|---|
| `ui-lead` | 팀장 / 오케스트레이터. 전체 UI 작업 플로우 제어. | ✗ (위임만) |
| `ui-composer` | `libs/ui` 에 신규 primitive 추가. | ✓ (`libs/ui/**`) |
| `ui-design-reviewer` | 디자인 일관성 감사. 읽기 전용. | ✗ |
| `ui-verifier` | Playwright 로 UX 동작 검증. | ✓ (`apps/*/tests/e2e/**` 만) |

## 표준 플로우 (ui-lead 가 수행)

```
1. 요청 분류 (신규 primitive / 페이지 UI / 디자인 시스템 초기화 / 수정)
2. 구현
   ├─→ ui-composer  (libs/ui primitive 필요 시)
   └─→ developer    (페이지/라우트/서비스 코드 수정이 필요 시)
3. ui-design-reviewer  (디자인 일관성 감사)
   └─ 위반 있으면 → 2 로 돌아가 수정 (최대 3회)
4. ui-verifier  (Playwright 기능 검증)
   └─ 실패 있으면 → 2 로 돌아가 수정 (최대 3회)
5. ui-lead 자체 최종 패스 (diff 훑어보기)
6. 리포트 반환 (PASS/FAIL + 변경 파일 + 제안 커밋 메시지)
   → 메인 에이전트가 사용자에게 커밋 승인 요청
     → 승인 시 메인이 git commit 실행
```

## 호출 규약

- 메인 에이전트:
  ```
  Task(subagent_type="ui-lead", prompt="<UI 요청 자연어>")
  ```
- ui-lead 내부 위임:
  ```
  Task(subagent_type="ui-composer",        prompt="<스펙>")
  Task(subagent_type="ui-design-reviewer", prompt="<변경 파일 목록>")
  Task(subagent_type="ui-verifier",        prompt="<시나리오>")
  ```
- **주의**: `subagent_type` 은 파일 frontmatter 의 `name:` 필드로 해석되며 경로와
  무관. 서브트리에 있어도 이름만 맞으면 호출된다.

## 절대 하지 말 것

- 메인 에이전트가 `ui-composer` / `ui-verifier` / `ui-design-reviewer` 를 **직접**
  호출 (단일 진입점 원칙 위반). 예외: 사용자가 명시적으로 "composer만 돌려" 같이
  요청한 경우.
- `ui-lead` 가 파일을 직접 수정 (composer/developer 에게 위임).
- `ui-lead` 가 `git commit` 을 직접 실행 (사용자 승인 후 메인이 수행).
