# User Management

## 개요
시스템 사용자의 기본 정보를 관리한다 (생성/조회/수정/삭제).

## 사용자 가치
- 관리자가 사용자 목록을 한눈에 확인
- 신규 사용자 등록 및 정보 수정
- 더 이상 유효하지 않은 사용자 제거

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| User | id | Long | No | PK, auto-increment |
| User | email | String | No | 유니크, 최대 255자 |
| User | name | String | No | 최대 255자 |
| User | createdAt | LocalDateTime | No | JPA Auditing 자동 설정 |
| User | updatedAt | LocalDateTime | No | JPA Auditing 자동 설정 |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/users` | 전체 리스트 조회 | - | `UserResponse[]` |
| GET | `/users/{id}` | 단일 조회 | - | `UserResponse` |
| POST | `/users` | 신규 생성 | `CreateUserRequest` | `UserResponse` (201) |
| PATCH | `/users/{id}` | 부분 수정 | `UpdateUserRequest` | `UserResponse` |
| DELETE | `/users/{id}` | 삭제 | - | 204 No Content |

**DTO 스키마:**
- `UserResponse`: `{ id, email, name }`
- `CreateUserRequest`: `{ email, name }` — email 형식 검증, name 공백 아님
- `UpdateUserRequest`: `{ name }` — 공백 아님

## 비즈니스 규칙
- 이메일은 유니크 (중복 생성 시 `DuplicateEmailException`)
- 없는 ID로 조회/수정/삭제 시 `UserNotFoundException` → 404
- 이메일 형식 검증은 서버 Bean Validation (`@Email`)

## 관련 화면
- [screens/user-list.md](../screens/user-list.md)
- [screens/user-form.md](../screens/user-form.md)
