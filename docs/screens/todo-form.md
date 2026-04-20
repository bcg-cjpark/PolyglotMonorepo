# Todo Form (New / Edit)

## 기본 정보
- **Route**: `/todos/new` (신규), `/todos/:id/edit` (수정)
- **파일 위치**: `apps/example-web/src/pages/TodoFormPage.tsx`
- **관련 PRD**: [prd/todo.md](../prd/todo.md)

## 목적
Todo 신규 생성 / 기존 수정을 위한 공통 폼. URL 에 `:id` 있으면 수정 모드.

## 레이아웃

ASCII 와이어프레임:

```
┌──────────────────────────────────────┐
│  New Todo        (또는 "Edit Todo")   │  ← 헤더 (모드별 제목)
├──────────────────────────────────────┤
│                                      │
│  Title *                             │
│  ┌────────────────────────────────┐  │
│  │ Finish project report          │  │  ← 단일행 텍스트 입력 (필수)
│  └────────────────────────────────┘  │
│                                      │
│  Description                         │
│  ┌────────────────────────────────┐  │
│  │ Prepare slides and talking     │  │  ← 여러 줄 텍스트 입력
│  │ points for Monday presentation │  │
│  └────────────────────────────────┘  │
│                                      │
│  Due Date                            │
│  ┌─────────────────┐                 │
│  │ 2026-04-25      │                 │  ← 날짜 선택
│  └─────────────────┘                 │
│                                      │
│  [ Create ]  [ Cancel ]              │  ← 수정 모드면 "Update"
│                                      │
└──────────────────────────────────────┘
```

**영역 구성:**
- 헤더: 모드별 제목 ("New Todo" / "Edit Todo")
- 입력 영역 (세로 배치, max-width 제한):
  - Title (필수)
  - Description (선택, 여러 줄)
  - Due Date (선택, 날짜 선택기)
- 액션 버튼 행: Create/Update + Cancel

## 컴포넌트
| 역할 | UI 종류 | 비고 |
|---|---|---|
| Title 입력 | 단일행 텍스트 입력 | 필수, 공백 허용 |
| Description 입력 | 여러 줄 텍스트 입력 | 선택 |
| Due Date 입력 | 날짜 선택 | 선택, YYYY-MM-DD |
| 제출 버튼 | Primary 버튼 | 모드에 따라 label "Create" / "Update" |
| 취소 버튼 | Secondary 버튼 | label "Cancel" |

## 인터랙션
1. 진입 시 URL 에 `:id` 있으면 `GET /todos/{id}` → 폼 필드 채우기
2. URL 에 `:id` 없으면 빈 폼
3. Title 입력 필수 (빈 값이면 제출 버튼 disabled)
4. "Create" / "Update" 클릭 → 폼 `onSubmit`:
   - 신규: `POST /todos` with `{title, description?, dueDate?}`
   - 수정: `PATCH /todos/{id}` with 변경된 필드만
   - 성공 시 `/todos` 로 네비게이션
5. "Cancel" 클릭 → 입력 버리고 `/todos` 로 이동 (API 호출 없음)
6. 제출 중: 제출 버튼 "Saving…" + disabled

## 데이터 바인딩
- 수정 모드 진입 시: `GET /todos/{id}` → `TodoResponse`
- 제출:
  - 신규: `POST /todos` → 201 Created
  - 수정: `PATCH /todos/{id}` → 200 OK
- 에러: 서버 응답 메시지 (후에 구체화)

## 상태
| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| title | `string` | `""` (or 로드값) | 제목 입력 변경 |
| description | `string` | `""` (or 로드값) | 설명 입력 변경 |
| dueDate | `string` | `""` (or 로드값, "YYYY-MM-DD") | 마감일 입력 변경 |
| submitting | `boolean` | `false` | 제출 시작/종료 |
| loading | `boolean` | `true` (수정 모드) / `false` (신규) | GET 시작/종료 |
| error | `string \| null` | `null` | 요청 실패 |

## 추가 고려 (구현 단계에서 논의)
- URL 파라미터 `:id` 존재 여부로 모드 분기 — `useParams()` 사용
- 수정 모드에서 데이터 로드 중에는 폼 필드 `disabled` 또는 placeholder "Loading…"
- 제출 실패 시 폼 상태 유지, 에러 표시 후 재시도 가능
