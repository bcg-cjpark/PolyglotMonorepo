# screens/ — 화면정의서 포맷 가이드

## 파일 네이밍

- `<page-slug>.md` (예: `user-list.md`, `user-form.md`, `billing-detail.md`)
- 1 화면 = 1 파일.

## 필수 섹션 (에이전트가 이 헤딩을 grep 하므로 변경 금지)

```markdown
# <화면 이름>

## 기본 정보
- **Route**: `/users` (React Router path)
- **파일 위치**: `apps/example-web/src/pages/UserListPage.tsx`
- **관련 PRD**: [prd/user-management.md](../prd/user-management.md)

## 목적
<한 문장으로 이 화면의 역할>

## 레이아웃
<화면 상단부터 아래로 배치된 영역을 순서대로 bullet>

- 헤더 영역 (제목 + 액션 버튼)
- 메인 영역 (테이블 or 폼 or 대시보드)
- 푸터 (필요 시)

## 컴포넌트
화면에 필요한 **UI 종류(카테고리)** 를 명시. 특정 라이브러리/구현체(`Input`, `Button`,
`native <textarea>` 등) 는 쓰지 말 것 — 라이브러리 선택은 구현 단계에서 `libs/ui` 우선
규칙(`CLAUDE.md`) 에 따라 결정됨.

| 역할 | UI 종류 | 비고 |
|---|---|---|
| 기본 버튼 | Primary 버튼 | 필요 시 label, 위험 액션 여부 등 기능적 속성만 기술 |
| 입력 필드 | 단일행 텍스트 입력 | 필수 여부, 공백 허용 여부 같은 UX 제약만 |
| 리스트 | 리스트 또는 테이블 | 다수 행 / 컬럼 요구사항 |

## 인터랙션
<사용자 액션 → 시스템 반응을 순서대로>

1. 화면 진입 시 `GET /users` 호출하여 리스트 렌더
2. "+ New" 버튼 클릭 → `/users/new` 로 이동
3. "Delete" 클릭 → `DELETE /users/{id}` 호출 후 리스트 재조회

## 데이터 바인딩
- 사용하는 API: (PRD 의 엔드포인트 표에서 참조)
- 로딩 / 에러 / 빈 상태 각각 표시 방식 명시

## 상태 (State)
| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| users | User[] | [] | GET /users 응답 |
| loading | boolean | true | 요청 시작/종료 |
| error | string \| null | null | 요청 실패 |
```

## 작성 팁

- **컴포넌트 표**는 UI 종류(카테고리) 수준으로만. 특정 컴포넌트명(`Input`, `Button`) 이나
  `native <textarea>` 같은 구현 레이어를 적지 말 것. 라이브러리 선택은 구현 단계에서
  "libs/ui 우선 → 없으면 `ui-composer` → native 는 최후" 순서로 결정됨 (`CLAUDE.md` 참조).
- **인터랙션**은 Playwright e2e 테스트의 시나리오가 됨. 명확하게 번호 매겨서.
- **상태**는 React `useState` 매핑. 에이전트가 이대로 훅을 선언.
