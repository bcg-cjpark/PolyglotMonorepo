# User List

## 기본 정보
- **Route**: `/users`
- **파일 위치**: `apps/example-web/src/pages/UserListPage.tsx`
- **관련 PRD**: [prd/user-management.md](../prd/user-management.md)

## 목적
등록된 전체 사용자를 테이블로 보여주고, 개별 삭제 및 신규 생성 진입을 제공.

## 레이아웃
- 헤더: 좌측 제목("Users"), 우측 "+ New" 버튼
- 메인: 사용자 테이블 (ID, Email, Name, Action 컬럼)
- 빈 상태: "No users yet." 메시지

## 컴포넌트
| 역할 | UI 종류 | 비고 |
|---|---|---|
| "+ New" 버튼 | Primary 버튼 | 클릭 시 `/users/new` 로 이동 |
| "Delete" 버튼 | 작은 위험(Destructive) 버튼 | 클릭 시 `DELETE /users/{id}` |
| 사용자 목록 | 데이터 그리드 | 컬럼: ID / Email / Name / Action. 정렬/페이지네이션 불요 |

## 인터랙션
1. 화면 진입 시 `GET /users` → `users` 상태에 저장
2. "+ New" 클릭 → `/users/new` 로 이동 (`useNavigate`)
3. "Delete" 클릭 → `DELETE /users/{id}` 후 `GET /users` 재호출로 리스트 갱신
4. 데이터 없으면 빈 상태 메시지 표시

## 데이터 바인딩
- `GET /users` → `UserResponse[]`
- 로딩 중: "Loading…" 표시
- 에러: "Error: {message}" 빨간 텍스트

## 상태
| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| users | `User[]` | `[]` | GET 응답 |
| loading | `boolean` | `true` | 요청 시작/종료 |
| error | `string \| null` | `null` | 요청 실패 |
