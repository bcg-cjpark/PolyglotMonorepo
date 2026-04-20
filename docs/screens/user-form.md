# User Form (New User)

## 기본 정보
- **Route**: `/users/new`
- **파일 위치**: `apps/example-web/src/pages/UserFormPage.tsx`
- **관련 PRD**: [prd/user-management.md](../prd/user-management.md)

## 목적
신규 사용자 생성용 입력 폼.

## 레이아웃
- 헤더: "New User" 제목
- 폼 영역 (max-width 기준으로 중앙 혹은 좌측 정렬)
  - Email 입력
  - Name 입력
  - 액션 버튼 행 (Create, Cancel)

## 컴포넌트
| 역할 | 컴포넌트 | 비고 |
|---|---|---|
| Email 입력 | `Input` | placeholder="user@example.com", `full` |
| Name 입력 | `Input` | placeholder="Full name", `full`, `allowSpaces` (공백 허용) |
| Create 버튼 | `Button` | `buttonType=submit`, variant=`contained`, color=`primary` |
| Cancel 버튼 | `Button` | `buttonType=button`, variant=`outlined`, color=`grey` |

## 인터walk션
1. Email/Name 입력 후 "Create" 클릭
2. 폼 `onSubmit` → `POST /users` 호출 with `{email, name}`
3. 성공 시 `/users` 로 이동
4. "Cancel" 클릭 → 입력 버리고 `/users` 로 이동 (API 호출 없음)
5. 제출 중에는 "Create" 버튼을 "Saving…" + disabled

## 데이터 바인딩
- `POST /users` → 201 Created, 성공 시 리스트로 돌아감
- 실패 시(예: 이메일 중복) 서버 에러 메시지 표출 (현재 구현에선 생략, TODO)

## 상태
| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| email | `string` | `""` | Input onChange |
| name | `string` | `""` | Input onChange |
| submitting | `boolean` | `false` | 제출 시작/종료 |
