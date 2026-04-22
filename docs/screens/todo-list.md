# Todo List

## 기본 정보
- **Route**: `/todos`
- **파일 위치**: `apps/example-web/src/pages/TodoListPage.tsx`
- **관련 PRD**: [prd/todo.md](../prd/todo.md)

## 목적
전체 Todo 리스트를 보여주고, 개별 완료 토글 / 수정 / 삭제 / 신규 생성 진입을 제공.
상단 필터로 전체/진행중/완료 분류.

## 레이아웃

ASCII 와이어프레임 (디자인 시안 전 임시):

```
┌─────────────────────────────────────────────────────────┐
│  Todos                                      [+ New]     │  ← 헤더 (제목 + 신규 버튼)
├─────────────────────────────────────────────────────────┤
│  Filter:  [ All ]  [ Active ]  [ Completed ]            │  ← 탭 필터 (RadioGroup)
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ [✓]  Finish project report           2026-04-25   │  │
│  │      Prepare slides and talking points            │  │  ← 개별 Todo 행
│  │                                  [Edit] [Delete]  │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ [ ]  Call mom                        2026-04-22   │  │
│  │                                  [Edit] [Delete]  │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ [ ]  Buy groceries                                │  │  ← dueDate 없으면 빈칸
│  │                                  [Edit] [Delete]  │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  (빈 상태)  No todos yet. Click "+ New" to add one.     │  ← users 배열 비었을 때
└─────────────────────────────────────────────────────────┘
```

**영역 구성:**
- 헤더: 좌측 제목("Todos"), 우측 "+ New" 버튼
- 필터 바: 라디오 탭 (All/Active/Completed)
- 리스트: 각 행에 [체크박스, 제목, 설명(옵션), 마감일(옵션), Edit/Delete 버튼]
- 빈 상태: 메시지

## 컴포넌트
| 역할 | UI 종류 | 비고 |
|---|---|---|
| "+ New" 버튼 | Primary 버튼 | 클릭 시 `/todos/new` 로 이동 |
| 필터 탭 | 라디오 탭 (단일 선택) | 옵션: All / Active / Completed |
| 완료 체크박스 | 체크박스 | 행당 1개, 토글 시 `/todos/{id}/toggle` 호출 |
| Edit 버튼 | 작은 Secondary 버튼 | 클릭 시 `/todos/{id}/edit` 로 이동 |
| Delete 버튼 | 작은 위험(Destructive) 버튼 | 클릭 시 `DELETE /todos/{id}` |
| 리스트 컨테이너 | 데이터 그리드 | 각 행에 체크박스 / 제목 / 설명 / 마감일 / 액션 버튼을 셀로 렌더. 정렬/페이지네이션 불요 |
| 마감일 표시 | 텍스트 | 과거 날짜면 빨간색 강조 |

## 인터랙션
1. 진입 시 `GET /todos?status={filter}` 호출 → 리스트 렌더 (기본 filter=`all`)
2. 필터 탭 클릭 → 상태 `filter` 변경 → 재조회 (`GET /todos?status=...`)
3. 체크박스 클릭 → `PATCH /todos/{id}/toggle` → 응답으로 행 상태 갱신 (optimistic update 가능하나 초기엔 재조회)
4. "+ New" 클릭 → `/todos/new` 로 네비게이션
5. "Edit" 클릭 → `/todos/{id}/edit` 로 네비게이션
6. "Delete" 클릭 → 확인 없이 `DELETE /todos/{id}` → 리스트 재조회 (후에 확인 모달 추가 가능)
7. 리스트 비었을 때 빈 상태 메시지 표시

## 데이터 바인딩
- `GET /todos?status={filter}` → `TodoResponse[]` 로 `todos` 상태 저장
- `PATCH /todos/{id}/toggle` → 재조회 (단순 구현)
- `DELETE /todos/{id}` → 재조회
- 로딩 중: "Loading…" 표시
- 에러: 에러 메시지 (빨간 텍스트)

## 상태
| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| todos | `Todo[]` | `[]` | GET 응답 |
| filter | `"all" \| "active" \| "completed"` | `"all"` | 필터 탭 클릭 |
| loading | `boolean` | `true` | 요청 시작/종료 |
| error | `string \| null` | `null` | 요청 실패 |
