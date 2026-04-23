# Memo

## 개요
제목과 본문으로 구성된 간단한 텍스트 메모를 작성/조회/수정/삭제하는 기능.

## 사용자 가치
- 짧거나 긴 메모를 한 공간에 모아두고 최신순으로 확인할 수 있다.
- 메모 목록에서 원하는 메모의 상세 내용을 열어볼 수 있다.
- 새 메모를 빠르게 작성할 수 있다.
- 기존 메모의 제목/본문을 수정할 수 있다.
- 필요 없어진 메모를 삭제하기 전에 다시 한 번 확인할 수 있다.

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| Memo | id | UUID | No | PK, 서버 생성 |
| Memo | title | String | No | 최대 100자, 공백만 불가, 필수 |
| Memo | content | String | Yes | 최대 5000자, 빈 문자열 및 null 허용 (본문 없는 메모 가능) |
| Memo | createdAt | LocalDateTime | No | 생성 시각 (BaseEntity 상속) |
| Memo | updatedAt | LocalDateTime | No | 수정 시각 (BaseEntity 상속) |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/memos?page=0&size=20` | 페이징 리스트, `createdAt DESC` 고정 정렬 | - | `MemoPage` (200) |
| GET | `/memos/{id}` | 단건 조회 | - | `Memo` (200) / 없으면 404 |
| POST | `/memos` | 생성 | `CreateMemoRequest` | `Memo` (201) |
| PUT | `/memos/{id}` | 전체 교체 (title, content 모두 payload 필수) | `UpdateMemoRequest` | `Memo` (200) / 없으면 404 |
| DELETE | `/memos/{id}` | hard delete | - | (204) / 없으면 404 |

- `Memo`: `{ id: UUID, title: String, content: String?, createdAt: LocalDateTime, updatedAt: LocalDateTime }`
- `MemoPage`: `{ content: Memo[], totalElements: Long, totalPages: Int, page: Int, size: Int }` — `page` 는 0-base, `size` 기본 20
- `CreateMemoRequest`: `{ title: String, content: String? }` — title 은 1~100자, 공백만 불가. content 는 선택 (미전달 또는 null 허용, 0~5000자)
- `UpdateMemoRequest`: `{ title: String, content: String? }` — 전체 교체. 두 필드 모두 payload 에 포함되어야 하며 content 는 `null` 또는 `""` 로 비울 수 있음

## 비즈니스 규칙
- title 은 필수이며 1~100자, 공백만으로 구성된 값은 거부한다.
- content 는 0~5000자이며 null 및 빈 문자열을 허용한다 (= "본문 없는 메모").
- PK 를 UUID 로 사용한다. 메모 건수가 다량으로 늘어나도 ID 가 예측 불가능해야 하며, auto-increment 숫자 ID 를 URL/화면에 노출하는 것이 "작성물" 성격의 메모에 어색하기 때문이다.
- `PUT /memos/{id}` 는 전체 교체이며 PATCH 가 아니다. title, content 두 필드 모두 payload 에 있어야 한다. 본문을 비우려면 `content: ""` 또는 `content: null` 을 명시한다.
- 메모 본문은 마크다운/HTML 렌더링을 하지 않는다. plain text 로만 표시하며, XSS 방지 차원에서 저장된 문자열을 그대로 텍스트로 렌더한다.
- `DELETE /memos/{id}` 는 hard delete 로 수행되며 삭제된 메모는 복구할 수 없다. 사용자 실수 방지를 위해 화면 레이어에서 삭제 확인 단계를 두는 것을 의도한다.
- V1 은 단일 사용자 모델이다. `userId` 등 소유자 필드는 포함하지 않으며, 향후 인증/인가 피처 도입 시 확장한다.

## 관련 화면
- [screens/memo-list.md](../screens/memo-list.md)
- [screens/memo-dialog.md](../screens/memo-dialog.md)
- 신규/편집/삭제 확인 3 모드 UI 는 목록 화면 위 동일 오버레이 컨테이너(모달) 로 제공. 별도 편집 전용 페이지는 V1 에서 두지 않는다.

## 비기능 요구사항
- 리스트는 페이지네이션을 기본으로 적용한다 (`size=20`, `createdAt DESC`). 메모가 쌓이는 것이 기본 가정이므로 전체 로드 방식은 사용하지 않는다.
- 검색/필터 기능은 V1 에 포함하지 않으며, 목록 증가 추이에 따라 후속 버전에서 재검토한다.
- 상세/편집/삭제 확인은 목록 화면 위에 겹쳐서 표시되는 3 단계 흐름 (상세 열람 → 편집 → 삭제 확인) 으로 의도하되, 구체 UI 구현은 화면정의서에서 정의한다.
- `/memos/**` 엔드포인트는 현재 permitAll 로 공개되어 있다. 인증 피처 도입 시 접근 제어 정책을 재조정한다.
