# TodoListPage

## 기본 정보

- **Route**: `/todos`
- **파일 위치**: `apps/example-web/src/pages/TodoListPage.tsx`
- **관련 PRD**: [prd/todo.md](../prd/todo.md)
- **시안 선택**: TodoList Variant A (표 + 세그먼트) — [design-notes/todo-variants.md](../design-notes/todo-variants.md)

## 목적

할일 목록을 상태별(전체/진행 중/완료) 로 좁혀 보고, 한 번의 상호작용으로 완료 토글·삭제·생성 진입을 제공한다. `createdAt DESC` 정렬 고정.

## 레이아웃

위에서 아래로:

- 페이지 헤더 — 왼쪽 제목 "할 일", 오른쪽 Primary 버튼 "+ 새 할 일".
- 상태 필터 영역 — 세그먼트 컨트롤(또는 언더라인 라디오) 3 탭: "전체 / 진행 중 / 완료".
- 본문 표(정형 스키마) — 컬럼 5개: 체크 토글 / 제목 / 마감일 / 상태 배지 / 행 내 액션(편집·삭제).

헤더와 필터는 Loading / Error / Empty 상태 모두에서 유지. 본문(표 영역) 만 상태별 뷰로 치환.

## 컴포넌트

| 역할 | UI 종류 | 비고 |
|---|---|---|
| 페이지 헤더 | 제목 + 주요 액션 버튼 영역 | 페이지 탑 레벨 |
| 주요 액션 | Primary 버튼 | 라벨 "+ 새 할 일". 클릭 시 `/todos/new` |
| 상태 필터 | 세그먼트 컨트롤 또는 언더라인 라디오 그룹 | 3 옵션(전체/진행 중/완료). 드롭다운 금지 |
| 본문 표 | 표 (정형 스키마) | 컬럼 5개 + 빈 상태 문구 내장 |
| 체크 토글 | 체크박스 | 행 내 토글용, 낙관적 업데이트 |
| 상태 배지 | 상태 배지/칩 | "진행 중" / "완료" / "기한 지남" |
| 편집 액션 | 보조 버튼 또는 아이콘 버튼 | 행 내 |
| 삭제 액션 | 파괴형(Destructive) 보조 버튼 | 행 내. `window.confirm` 수용 |
| Loading 플레이스홀더 | 로딩 플레이스홀더(리스트 형태) | 본문 자리 치환, 헤더·필터 유지 |
| Error 안내 | 한국어 에러 텍스트 + "다시 시도" 보조 버튼 | 스택 트레이스 노출 금지 |
| Empty 안내 | 표 내장 빈 상태 문구 | 필터별 문구는 구현 단계 재량 (예: "표시할 할 일이 없습니다.") |
| 완료된 항목 시각 | 제목 취소선 + 의미 토큰 `text-muted` | 스케일 직접 참조 금지 |
| overdue 마감일 | 위험 색 토큰 (`font-color-danger`) 적용 | 행 전체 색 변경 금지, 마감일 텍스트만 |

※ 구현 라이브러리 선택은 `libs/ui` 우선 규칙(`CLAUDE.md`) 에 따라 결정.

## 인터랙션

1. 화면 진입 시 `GET /todos?status=all` 호출 → 본문 표에 렌더 (`createdAt DESC`).
2. **Loading**: 헤더 + 필터 유지. 본문은 로딩 플레이스홀더.
3. **Error**: 헤더 + 필터 유지. 본문에 한국어 에러 + "다시 시도". 클릭 시 재호출.
4. **Empty**: 헤더 + 필터 유지. 표의 빈 상태 문구. 사용자는 "+ 새 할 일" 또는 다른 필터 탭으로 이동.
5. 상태 필터 탭 클릭 → `GET /todos?status=all|active|completed` 재호출 (서버 필터, 클라이언트 필터 금지).
6. 체크박스 클릭 → `PATCH /todos/{id}/toggle` 호출. 응답 수신 전 낙관적 업데이트로 행의 `completed` 반전. 실패 시 롤백 + 한국어 에러.
7. 편집 버튼 클릭 → `/todos/{id}/edit` 이동.
8. 삭제 버튼 클릭 → `window.confirm("할 일을 삭제하시겠습니까?")` → 수락 시 `DELETE /todos/{id}` 호출. 204 성공 시 목록 재조회.
9. "+ 새 할 일" 클릭 → `/todos/new` 이동.

## 데이터 바인딩

- `GET /todos?status=all|active|completed` — 목록 (정렬 `createdAt DESC`).
- `PATCH /todos/{id}/toggle` — 완료 토글. 낙관적 업데이트.
- `DELETE /todos/{id}` — 행 삭제. 성공 후 쿼리 무효화로 재조회.

에러 문구는 한국어 고정. 서버 원문/스택 비노출.

## 상태 (State)

| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| status | "all" \| "active" \| "completed" | "all" | 필터 탭 클릭 |
| todos | Todo[] | [] | GET 응답 |
| isLoading | boolean | true | 쿼리 로딩 |
| isError | boolean | false | 쿼리 실패 |

토글/삭제는 각 뮤테이션 훅(TanStack Query) 의 상태로 관리.
