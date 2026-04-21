# Memo

## 개요
사용자가 짧은 글(제목 + 본문)을 모아 최신순으로 조회/열람/편집/삭제하는 기본 메모 관리 기능.

## 사용자 가치
- 순간의 생각이나 정보 조각을 가볍게 기록해 유실을 방지
- 최신순 리스트로 최근 메모를 빠르게 다시 꺼내 봄
- 리스트의 인라인 미리보기로 열지 않고도 개요 파악
- 단일 모달 폼으로 생성/편집 흐름 일관

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| Memo | id | UUID | No | PK |
| Memo | title | String | No | 메모 제목, 1~100자, 공백만은 불가 |
| Memo | content | String | Yes | 본문, 최대 5000자, 일반 텍스트 (마크다운 미지원) |
| Memo | createdAt | LocalDateTime | No | 생성 시각, JPA Auditing 자동 설정, 정렬 인덱스 대상 |
| Memo | updatedAt | LocalDateTime | No | 마지막 수정 시각, JPA Auditing 자동 설정 |

**인덱스:**
- `createdAt` DESC 인덱스 (리스트 정렬 성능용)

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/api/memos` | 메모 리스트 페이징 조회 (최신순) | `?page=0&size=20` | `PageResponse<MemoResponse>` |
| GET | `/api/memos/{id}` | 단건 조회 | - | `MemoResponse` |
| POST | `/api/memos` | 신규 생성 | `CreateMemoRequest` | `MemoResponse` (201) |
| PUT | `/api/memos/{id}` | 전체 교체 (title + content) | `UpdateMemoRequest` | `MemoResponse` |
| DELETE | `/api/memos/{id}` | 삭제 (hard delete) | - | 204 No Content |

**DTO 스키마:**
- `MemoResponse`: `{ id, title, content, createdAt, updatedAt }`
- `CreateMemoRequest`: `{ title, content? }` — title 공백 아님, 1~100자 / content 0~5000자
- `UpdateMemoRequest`: `{ title, content }` — title 공백 아님, 1~100자 / content 0~5000자. 두 필드 모두 필수(전체 교체 의미).
- `PageResponse<T>`: `{ content: T[], totalElements, totalPages, page, size }`

**요청/응답 예시:**

`POST /api/memos`
```json
// Request
{
  "title": "회의 요약",
  "content": "4월 21일 기획 회의 — PRD 통합 파이프라인 검증."
}

// Response 201
{
  "id": "8f3c2c7a-6b9d-4a9b-8e22-7f5a1a4e3b10",
  "title": "회의 요약",
  "content": "4월 21일 기획 회의 — PRD 통합 파이프라인 검증.",
  "createdAt": "2026-04-21T09:12:33",
  "updatedAt": "2026-04-21T09:12:33"
}
```

`GET /api/memos?page=0&size=20`
```json
{
  "content": [
    {
      "id": "8f3c2c7a-6b9d-4a9b-8e22-7f5a1a4e3b10",
      "title": "회의 요약",
      "content": "4월 21일 기획 회의 — PRD 통합 파이프라인 검증.",
      "createdAt": "2026-04-21T09:12:33",
      "updatedAt": "2026-04-21T09:12:33"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "page": 0,
  "size": 20
}
```

`PUT /api/memos/{id}`
```json
// Request — title, content 둘 다 새 값으로 전체 교체
{
  "title": "회의 요약 (수정본)",
  "content": "4월 21일 기획 회의 — 메모 기능 파이프라인 dogfooding."
}

// Response 200
{
  "id": "8f3c2c7a-6b9d-4a9b-8e22-7f5a1a4e3b10",
  "title": "회의 요약 (수정본)",
  "content": "4월 21일 기획 회의 — 메모 기능 파이프라인 dogfooding.",
  "createdAt": "2026-04-21T09:12:33",
  "updatedAt": "2026-04-21T09:20:11"
}
```

`DELETE /api/memos/{id}` → `204 No Content`

## 비즈니스 규칙
- 리스트 정렬: `createdAt` 내림차순 (최신이 위). 다른 정렬 옵션 없음.
- 페이징: 기본 `page=0`, `size=20`. 클라이언트가 파라미터 생략 시 기본값 사용.
- 사용자 격리: V1 은 단일 사용자 가정. `userId` 컬럼/인증 미도입. 모든 메모는 전역 공유 공간에 저장된 것으로 취급.
- 삭제 정책: hard delete. 복구 불가. 클라이언트 측에서 확인 다이얼로그로 오삭제 방지.
- 수정 의미: `PUT /api/memos/{id}` 는 전체 교체. `title` 과 `content` 둘 다 request body 에 포함되어야 하며, 둘 다 새 값으로 덮어씀. 부분 업데이트는 지원하지 않음.
- 제목 검증: `title` 은 공백만으로 구성된 값 거부 (`@NotBlank`), 1~100자.
- 본문 검증: `content` 는 선택 필드 (`null` 또는 빈 문자열 허용), 최대 5000자.
- 없는 ID 조회/수정/삭제 → `MemoNotFoundException` → 404.
- 저장되는 컨텐츠는 일반 텍스트로 처리. 서버/클라이언트 어느 쪽도 마크다운이나 HTML 을 렌더링하지 않음.

## UI 화면 요구사항
이번 단계에서는 Stitch 화면정의서를 스킵하므로 본 PRD 에서 화면별 상세는 다루지 않고, 구현 팀(프론트엔드 개발팀)이 참고할 **UI 카테고리 수준**의 요건만 기재한다.

### 메모 리스트 화면
- 리스트 컨테이너: 최신순으로 메모 카드/행을 나열.
- 각 항목 구성: 제목, 본문 인라인 미리보기(3~4줄로 잘라서 말줄임), 생성 시각.
- 항목 선택 시 전체 열람 진입.
- 신규 작성 진입 지점: 주요 액션 버튼(페이지 상단 또는 플로팅 위치).
- 빈 상태: 텍스트만 표시. 일러스트/아이콘 장식 없음.
- 페이지네이션 컨트롤: 페이지 이동 UI (다음/이전 또는 페이지 번호 형태는 구현 팀 판단).

### 메모 상세/열람 화면
- 제목과 본문 전체를 표시.
- 생성/수정 시각 표시.
- 편집 진입 액션, 삭제 액션 제공.
- 삭제 액션 선택 시 **확인 다이얼로그** 노출, 확인 후에만 실제 삭제 수행.

### 메모 작성/편집 폼
- 형식: **모달 형식 폼 다이얼로그**. 데스크톱/모바일 공통. 생성과 편집 동일 UI 재사용.
- 구성 요소:
  - 단일 행 텍스트 입력 (제목, 필수, 1~100자).
  - 다중 행 텍스트 영역 (본문, 선택, 최대 5000자).
  - 확인(저장) 액션 버튼, 취소 액션 버튼.
- 편집 진입 시 기존 값으로 폼 프리필.
- 유효성 실패 시 필드 하단 오류 메시지 표기.

## 비기능 요구사항
- 리스트 조회 응답 < 500ms (페이지 크기 20 기준, 단순 쿼리).
- `createdAt` 인덱스로 정렬/페이징이 풀스캔 없이 수행되어야 함.

## Out of Scope (후속 단계)
본 V1 의 범위 밖. 후속 PRD 또는 이터레이션에서 별도 기획.

- 멀티 유저 / 인증 / `userId` 격리
- 메모 공유, 협업, 권한
- 카테고리 / 태그
- 검색 (키워드, 본문 전문 검색)
- Soft delete 및 휴지통/복구
- 마크다운 또는 서식 있는 텍스트(rich text) 지원
- 빈 상태 일러스트
- 부분 업데이트(PATCH) 엔드포인트 — 필요 시 `PATCH /api/memos/{id}` 를 별도 추가
- 정렬 옵션 확장 (업데이트순, 제목순 등)
- 첨부파일 / 이미지

## 모순 / 미결 사항
없음. 산재 메모의 미결 항목은 아래와 같이 해소됨.

- 수정 API 시맨틱: `PUT = 전체 교체`로 확정. 부분 업데이트는 Out of Scope (후속 PATCH 로 분리).
- 작성/편집 UI 폼 배치: 모달 형식 폼 다이얼로그로 확정 (생성/편집 공용).
- 삭제 정책: hard delete 로 확정. soft delete 는 Out of Scope.
- 사용자 격리: V1 단일 사용자로 확정. 멀티 유저는 Out of Scope.

## 관련 화면
이번 단계에서는 Stitch 화면정의서(`docs/screens/*.md`)를 생성하지 않는다. 프론트엔드 개발팀은 본 PRD 의 "UI 화면 요구사항" 섹션을 참고해 구현한다.
