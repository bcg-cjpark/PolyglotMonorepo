# Todo 피처 사후 감사 리포트

**날짜**: 2026-04-24
**감사자**: spec-auditor (dogfooding 파이프라인 [9])
**관련 커밋**: 4761807 (API + V2__todo.sql), 65b3d58 (Jackson PUT 전체 교체 강제), d571061 (Web), 190ca5f (화면 e2e), 8ec7541 (통합 e2e)
**명세 (진실 소스)**:
- [docs/prd/todo.md](../prd/todo.md)
- [docs/screens/todo-list.md](../screens/todo-list.md)
- [docs/screens/todo-form.md](../screens/todo-form.md)

---

## 요약

- **상태**: PASS (재작업 지시 없음)
- **Critical 불일치**: 0 건
- **Minor 불일치**: 2 건 (관찰만)
- **수용 가능 스킵**: 1 건 (Loading/Error 화면 e2e — User 감사와 동일 사유로 수용)
- **전체 정합**: PRD 도메인 모델 / API 6 엔드포인트 / HTTP 상태 코드 / 비즈니스 규칙 7 항 / TodoListPage 인터랙션 1~9 / TodoFormPage 인터랙션 1~6 / 횡단 JSON·에러 포맷 / 3 층 테스트 피라미드 (Controller 22 + 화면 10 + 통합 8 = 40) 모두 구현과 일대일 매칭.
- **dogfooding 하이라이트**: (a) PUT 전체 교체가 `@field:JsonProperty(required=true)` + `FAIL_ON_MISSING_CREATOR_PROPERTIES` 로 강제되고 3 층 모두에서 검증됨, (b) 토글 낙관적 업데이트가 화면 e2e T5 + 통합 e2e T8 로 이중 검증됨, (c) overdue 시각 규칙 (`isOverdue` 순수 함수 + `text-red-red900` 토큰) 이 화면 e2e T9 로 확정됨.

---

## 섹션 1. PRD ↔ 백엔드

### 1.1 도메인 모델 (Todo 엔티티)

| PRD Field | Type | Nullable | 제약 | 코드 | 상태 |
|---|---|---|---|---|---|
| id | Long | No | PK, auto-increment | `Todo.kt:22-24` + `V2__todo.sql:5` `BIGINT AUTO_INCREMENT PK` | OK |
| title | String | No | `@NotBlank`, 200자 | `Todo.kt:15-16` + DTO `@NotBlank @Size(max=200)` | OK |
| completed | Boolean | No | 기본 false | `Todo.kt:17-18` + `V2__todo.sql:7` `BOOLEAN DEFAULT FALSE` | OK |
| dueDate | LocalDate | Yes | nullable | `Todo.kt:19-20` + `V2__todo.sql:8` `DATE NULL` | OK |
| createdAt / updatedAt | LocalDateTime | No | BaseEntity | `BaseEntity` + `DATETIME(6) NOT NULL` | OK |

### 1.2 API 엔드포인트 (6/6)

| PRD | 코드 | 상태 |
|---|---|---|
| GET `/todos?status=...` | `TodoController.kt:27-30` + when 분기 | OK |
| GET `/todos/{id}` | `:32-35` → `findById` orElseThrow | OK |
| POST `/todos` | `:37-41` `@ResponseStatus(CREATED)` | OK |
| PUT `/todos/{id}` | `:43-55` `@Valid` | OK |
| PATCH `/todos/{id}/toggle` | `:57-60` | OK |
| DELETE `/todos/{id}` | `:62-68` `noContent()` | OK |

### 1.3 HTTP 상태 코드 (5/5)

201 / 204 / 404 / 400 (invalid status) / 400 (validation, JSON 역직렬화 포함) 전부 매핑.

### 1.4 비즈니스 규칙 (7/7)

- title @NotBlank + 200자
- dueDate 과거/미래/null 허용 (overdue 는 화면 책임)
- createdAt DESC 정렬 (Repository 메서드명 + `idx_todos_created_at`)
- status 쿼리 검증 (invalid → 400)
- **PUT 전체 교체 강제** — `@field:JsonProperty(required=true)` + `FAIL_ON_MISSING_CREATOR_PROPERTIES=true` + `GlobalExceptionHandler`
- PATCH toggle 편의 엔드포인트
- hard delete

### 1.5 Controller 테스트

22 케이스 — GET list 5 + GET one 2 + POST 4 + PUT 7 (전체 교체 누락 3 케이스 포함) + PATCH 2 + DELETE 2.

---

## 섹션 2. PRD ↔ 프론트 (계약)

### 2.1 서비스 (6/6)

getTodos / getTodo / createTodo / updateTodo / toggleTodo / deleteTodo 모두 매핑. User 와 대조적으로 편집 UI 가 있어 `updateTodo` 도 구현됨.

### 2.2 TypeScript DTO

Long → number, LocalDate → string|null, LocalDateTime → string (ISO 8601). 타입 수준에서 PRD 와 일치.

### 2.3 TanStack Query

- `useTodosQuery(status)` — queryKey `['todos', { status }]`.
- `useTodoQuery(id)` — `enabled: id != null`.
- CRUD 훅 4개 + **`useToggleTodoMutation`** — onMutate/onError/onSettled 낙관적 업데이트 완비.

---

## 섹션 3. screens ↔ 프론트

### 3.1 TodoListPage 레이아웃 (12/12)

Route `/todos`. 헤더 + `RadioGroup` 3옵션 필터 + Table 5컬럼 + `renderBody()` 패턴 (헤더/필터 Loading/Error/Empty 유지). `@monorepo/ui` primitive (Button/Checkbox/Chip/ListSkeleton/RadioGroup/Table) 만 사용, 앱 내부 ad-hoc primitive 0.

완료 항목 시각: `text-muted line-through decoration-2`. Overdue: 마감일 셀만 `text-red-red900 font-semibold` (행 전체 색 변경 없음). 상태 배지: 완료=green / 진행=yellow / 기한지남=red Chip.

### 3.2 TodoListPage 인터랙션 1~9

| # | 요구 | e2e | 상태 |
|---|---|---|---|
| 1 | 진입 GET | T1 | OK |
| 2 | Loading | 스킵 | **수용** |
| 3 | Error | 스킵 | **수용** |
| 4 | Empty | T1 간접 | OK |
| 5 | 필터 서버 재조회 | T6 | OK |
| 6 | 체크 toggle + 낙관적 | T5 + 통합 T8 | OK |
| 7 | 편집 네비 | T7 | OK |
| 8 | 삭제 confirm | T8 + 통합 T1 | OK |
| 9 | 생성 네비 | T2/T10 | OK |

### 3.3 TodoFormPage (10/10 + 인터랙션 1~6)

Route `/todos/new`, `/todos/:id/edit`. 세로 스택 폼. 생성/편집 분기. 저장/취소. `renderBody()` 로 편집 모드 초기 fetch Loading/Error.

**Minor 관찰 1**: 마감일이 native `<input type="date">` (DatePicker primitive 부재, 토큰 변수 직접 참조로 시각 일관성 유지). V2 백로그.

**Minor 관찰 2**: 400 응답 분기를 "저장에 실패" 일괄 처리. 로컬 검증 선행으로 실제 도달 경로 거의 없음. 수용.

---

## 섹션 4. 횡단 정합

- JSON camelCase (Kotlin 프로퍼티 ↔ DB snake_case @Column 매핑).
- POST `{title, dueDate?}` / PUT `{title, completed, dueDate}` 프론트-백 완전 일치.
- 에러 `{ message, errors? }` 포맷 + 프론트 한국어 고정.
- **PUT 전체 교체 강제** — Jackson required + Global handler 로 Controller Test + 통합 T4 검증 완비.

---

## 섹션 5. 테스트 커버리지 매트릭스

| 규칙 | Controller | 화면 e2e | 통합 e2e |
|---|---|---|---|
| title @NotBlank/200자 | POST/PUT | T3/T4 | T6 |
| dueDate null/값 | POST 2 + PUT 1 | T10/T2 | T1/T6/T4 |
| PUT 전체 교체 누락 400 | PUT 3 누락 | - | T4 |
| status 필터 | GET 4 | T6 | T3 |
| 정렬 DESC | - | - | T2 |
| toggle 낙관적 | PATCH 1 | T5 양방향 | T8 |
| hard delete | DELETE 1 | T8 | T1 |
| 404 | 4 | - | T5 |
| overdue 시각 | - | T9 | - |
| 한글 UTF-8 | - | T10 | T7 |

3 층 피라미드 건강. dogfooding 신규 검증 포인트 (PUT 전체 교체 강제, 낙관적 업데이트, overdue) 모두 커버.

---

## 권고 사항 (V2 백로그)

1. **[UI, 낮음]** `libs/ui/DatePicker` primitive 추가 후 TodoFormPage 의 native `<input type="date">` 교체.
2. **[Frontend, 낮음]** TodoFormPage 400 분기 서버 errors 필드별 인라인 매핑 세분화.
3. **[Test, 낮음]** Loading/Error 화면 e2e 복구 (MSW 도입 시점).
4. **[Observation]** `isOverdue` 유틸 추출 검토 (재등장 시).
5. **[Observation]** userId 필드 부재 — V1 단일 사용자 전제. 멀티 유저 도입 시 V4 마이그레이션.

---

## 결론

**PASS (재작업 지시 없음)**

도메인 6/6, 엔드포인트 6/6, 상태 코드 5/5, 비즈니스 규칙 7/7, UI 매핑 TodoListPage 12/12 + TodoFormPage 10/10, 인터랙션 TodoListPage 1~9 중 7 직접 + 2 수용 스킵, TodoFormPage 1~6 전부 직접. Controller 22 + 화면 10 + 통합 8 = 40 케이스로 PUT 전체 교체 강제 + 낙관적 업데이트 양방향 + overdue 시각 dogfooding 신규 포인트 전부 검증.

Critical 0, Minor 2 (수용). dogfooding 파이프라인 [9] **통과**.
