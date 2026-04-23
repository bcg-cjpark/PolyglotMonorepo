# TodoFormPage

## 기본 정보

- **Route**:
  - `/todos/new` — 생성 모드
  - `/todos/:id/edit` — 편집 모드
- **파일 위치**: `apps/example-web/src/pages/TodoFormPage.tsx`
- **관련 PRD**: [prd/todo.md](../prd/todo.md)
- **시안 선택**: TodoForm Variant A (세로 스택) — [design-notes/todo-variants.md](../design-notes/todo-variants.md)

## 목적

단일 할 일의 제목/마감일(선택)/완료 여부(편집 모드 한정) 를 생성하거나 전체 교체한다.

## 레이아웃

위에서 아래로:

- 페이지 헤더 — 제목 "새 할 일" 또는 "할 일 편집" + 보조 "취소" 버튼.
- 폼 본문 (세로 스택) —
  - 제목 입력 (필수, 최대 200자, 공백만 금지, 한글 IME 대상).
  - 마감일 날짜 선택 입력 (선택).
  - (편집 모드만) 완료 여부 체크박스.
  - 각 필드 아래 에러/헬퍼 텍스트 자리.
- 하단 액션 바 — Primary "저장" + 보조 "취소" (우측 정렬).

Loading/Error 시에도 헤더 유지. 본문만 상태 뷰로 치환.

## 컴포넌트

| 역할 | UI 종류 | 비고 |
|---|---|---|
| 페이지 헤더 | 제목 + 보조 액션 | "취소" 는 보조 (ghost/outline) |
| 제목 입력 | 단일행 텍스트 입력 | 필수, maxLength 200, 한글 IME 허용 |
| 마감일 선택 | 날짜 선택 입력 | 선택 (null 허용). 비우면 기한 없음 |
| 완료 체크박스 (편집 모드) | 체크박스 | PUT payload 의 `completed` 필드 |
| 필드 라벨 | 텍스트 라벨 | 각 필드 상단 |
| 에러/헬퍼 | 에러 톤 인라인 텍스트 | 한국어 고정 |
| 주요 액션 | Primary 버튼 | "저장". 제출 중 로딩/비활성 |
| 보조 액션 | 보조 버튼 (ghost/outline) | "취소" |
| Loading (편집 fetch) | 로딩 플레이스홀더 | 초기 GET 중 |
| Error (편집 fetch) | 한국어 에러 + "다시 시도" | 스택 비노출 |

## 인터랙션

1. **생성 모드 진입**: `/todos/new` 접근 → 빈 폼 표시.
2. **편집 모드 진입**: `/todos/:id/edit` → `GET /todos/{id}` 호출 → 응답으로 폼 초기값 주입. 404 시 한국어 에러 페이지(또는 헤더 유지 + 에러 본문).
3. 제목 입력 중 공백만 / 200자 초과 → 인라인 에러 표시, "저장" 버튼 비활성.
4. 마감일 미입력 → 그대로 저장 시 payload `dueDate: null`.
5. "저장" 클릭:
   - 생성 모드: `POST /todos` → 201 성공 시 `/todos` 로 이동.
   - 편집 모드: `PUT /todos/{id}` (전체 교체, `dueDate: null` 명시로 기한 제거 가능) → 200 성공 시 `/todos` 이동.
   - 400 유효성 실패: 해당 필드 인라인 에러.
   - 404 (편집 모드): 한국어 안내.
   - 저장 중: 버튼 로딩/비활성.
6. "취소" 클릭 → `/todos` 이동. dirty-check 없음 (V1).

## 데이터 바인딩

- `GET /todos/{id}` — 편집 초기 fetch.
- `POST /todos` — 생성 `{title, dueDate}`.
- `PUT /todos/{id}` — 전체 교체 `{title, completed, dueDate}`.

## 상태 (State)

| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| title | string | "" (생성) / 초기 fetch 값 (편집) | 입력 |
| dueDate | string \| null | null | 날짜 선택 |
| completed (편집 모드) | boolean | 초기 fetch 값 | 체크박스 |
| formErrors | { title?: string } | {} | 로컬 검증 / 서버 400 |
| isSubmitting | boolean | false | 뮤테이션 isPending |
| isLoadingInitial (편집 모드) | boolean | true/false | 초기 fetch 쿼리 |
