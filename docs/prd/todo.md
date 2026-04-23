# Todo

## 개요
개인 할일 관리 — 항목을 추가·체크·삭제하고, 완료 상태로 필터링하며, 마감일을 추적한다.

## 사용자 가치
- 해야 할 일을 한곳에 쌓아두고 즉시 추가·삭제할 수 있다.
- 완료 여부에 따라 할 일 목록을 좁혀 볼 수 있다 (전체 / 진행 중 / 완료).
- 마감일이 있는 항목과 없는 항목을 함께 다루며, 기한이 지난 항목은 목록에서 구분해 볼 수 있다.
- 한 번의 상호작용으로 완료/미완료 상태를 전환할 수 있다.

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| Todo | id | Long | No | PK, auto-increment |
| Todo | title | String | No | 할 일 내용. 최대 200자. 공백만은 허용하지 않음 (`@NotBlank`). |
| Todo | completed | Boolean | No | 완료 여부. 기본값 `false`. |
| Todo | dueDate | LocalDate | Yes | 마감일. 없으면 기한 없는 항목. |
| Todo | createdAt | LocalDateTime | No | 생성 시각 (BaseEntity). |
| Todo | updatedAt | LocalDateTime | No | 수정 시각 (BaseEntity). |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/todos?status=all\|active\|completed` | 리스트 조회. `createdAt DESC` 정렬. `status` 생략 시 `all`. | - | `TodoResponse[]` |
| GET | `/todos/{id}` | 단건 조회. 없으면 404. | - | `TodoResponse` |
| POST | `/todos` | 생성. 201 반환. | `CreateTodoRequest` | `TodoResponse` |
| PUT | `/todos/{id}` | 전체 교체. payload 의 모든 필드가 필수 (dueDate 는 null 허용). | `UpdateTodoRequest` | `TodoResponse` |
| PATCH | `/todos/{id}/toggle` | `completed` 반전. 낙관적 업데이트 대상. | - | `TodoResponse` |
| DELETE | `/todos/{id}` | hard delete. 204 반환. | - | - |

### DTO 스키마
- `TodoResponse`: `{ id: Long, title: String, completed: Boolean, dueDate: LocalDate?, createdAt: LocalDateTime, updatedAt: LocalDateTime }`
- `CreateTodoRequest`: `{ title: String, dueDate: LocalDate? }` — `title` `@NotBlank` + 최대 200자, `dueDate` 선택.
- `UpdateTodoRequest`: `{ title: String, completed: Boolean, dueDate: LocalDate? }` — 모든 필드 payload 필수. `dueDate` 는 `null` 명시 시 제거.

### 쿼리 파라미터 매핑
- `status=all` (또는 생략) → 필터 없음.
- `status=active` → `completed = false`.
- `status=completed` → `completed = true`.

## 비즈니스 규칙
- `title` 은 `@NotBlank` + 최대 200자. 공백만으로는 생성·수정 불가.
- `dueDate` 는 미래/과거 모두 허용. API 는 원천 데이터만 제공하고, "과거 + `completed=false`" 조합을 overdue 로 해석해 구분 표시하는 규칙은 화면 쪽 책임.
- 리스트 정렬은 `createdAt DESC` 고정.
- `status` 쿼리 파라미터의 허용 값은 `all`, `active`, `completed` 셋. 그 외 값은 400.
- `PUT /todos/{id}` 는 전체 교체 시맨틱. `dueDate` 를 제거하려면 `{"dueDate": null}` 을 명시해야 한다.
- `PATCH /todos/{id}/toggle` 은 PUT 과 별개로, UX 상 한 번의 상호작용으로 상태를 반전시키기 위한 편의 엔드포인트.
- 삭제는 hard delete. soft delete / 복구 기능 없음.

## 관련 화면
- [screens/todo-list.md](../screens/todo-list.md)
- [screens/todo-form.md](../screens/todo-form.md)

## 비기능 요구사항
- V1 은 단일 사용자 전제. `Todo` 엔티티에 `userId` 필드 없음 — 전역 공유 리스트.
- V1 은 페이지네이션 미적용. 전체 결과를 단일 응답으로 반환.
- 상태별 필터링은 서버사이드 (쿼리 파라미터 기반). 클라이언트 사이드 필터 금지 — 데이터 증가 시 페이지네이션과 함께 확장하기 위해.
