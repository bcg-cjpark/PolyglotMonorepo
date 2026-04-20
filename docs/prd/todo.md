# Todo Management

## 개요
개인 할 일을 기록/조회/완료 처리/삭제하는 기본 Todo 관리 기능.

## 사용자 가치
- 해야 할 일을 누락 없이 관리
- 완료/미완료 필터로 남은 작업 한눈에 파악
- 마감일 설정으로 우선순위 구분

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| Todo | id | Long | No | PK, auto-increment |
| Todo | title | String | No | 할 일 제목, 최대 200자 |
| Todo | description | String | Yes | 상세 설명, 최대 2000자 |
| Todo | completed | Boolean | No | 완료 여부, 기본값 `false` |
| Todo | dueDate | LocalDate | Yes | 마감일 (시간 제외) |
| Todo | createdAt | LocalDateTime | No | JPA Auditing 자동 설정 |
| Todo | updatedAt | LocalDateTime | No | JPA Auditing 자동 설정 |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/todos` | 전체 리스트 조회 (쿼리로 필터 가능) | `?status=all\|active\|completed` | `TodoResponse[]` |
| GET | `/todos/{id}` | 단일 조회 | - | `TodoResponse` |
| POST | `/todos` | 신규 생성 | `CreateTodoRequest` | `TodoResponse` (201) |
| PATCH | `/todos/{id}` | 부분 수정 (제목/설명/마감일) | `UpdateTodoRequest` | `TodoResponse` |
| PATCH | `/todos/{id}/toggle` | 완료 상태 토글 | - | `TodoResponse` |
| DELETE | `/todos/{id}` | 삭제 | - | 204 No Content |

**DTO 스키마:**
- `TodoResponse`: `{ id, title, description, completed, dueDate, createdAt, updatedAt }`
- `CreateTodoRequest`: `{ title, description?, dueDate? }` — title 공백 아님 (`@NotBlank`), 최대 200자
- `UpdateTodoRequest`: `{ title?, description?, dueDate? }` — 모두 optional, title 주면 공백 아님

## 비즈니스 규칙
- 제목은 필수, 공백 불가, 최대 200자
- 설명은 선택, 최대 2000자
- 마감일이 과거면 저장은 허용하되 UI에서 빨간 강조 (PRD 단계에서는 서버 검증 안 함)
- 없는 ID 조회/수정/삭제 → `TodoNotFoundException` → 404
- 필터 `status` 값은 `all`(기본) / `active`(completed=false) / `completed`(completed=true) 3가지만 허용

## 관련 화면
- [screens/todo-list.md](../screens/todo-list.md)
- [screens/todo-form.md](../screens/todo-form.md)

## 비기능 요구사항
- 리스트 페이지 로드 < 500ms (DB 단순 쿼리 수준)
- Todo 개수가 많아져도(~1000건) 리스트 렌더링 deterioration 없도록 페이지네이션은 추후 고려 (지금은 전체 조회)
