# User

## 개요
시스템 사용자의 기본 정보를 관리하는 CRUD 기능.

## 사용자 가치
- 관리자가 앱을 쓰는 사람을 등록할 수 있다.
- 관리자가 등록된 사용자 목록과 상세 정보를 조회할 수 있다.
- 관리자가 사용자의 이메일/이름을 수정할 수 있다.
- 관리자가 더 이상 필요 없는 사용자를 삭제할 수 있다.

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| User | id | Long | No | PK, auto-increment |
| User | email | String | No | 유니크, 최대 255자, 이메일 형식 (`email@domain.tld`) |
| User | name | String | No | 최대 100자, 공백만 불가 |
| User | createdAt | LocalDateTime | No | 생성 시각 (BaseEntity 상속) |
| User | updatedAt | LocalDateTime | No | 수정 시각 (BaseEntity 상속) |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/users` | 전체 리스트 조회, `createdAt DESC` 정렬 | - | `User[]` (200) |
| GET | `/users/{id}` | 단건 조회 | - | `User` (200) / 없으면 404 |
| POST | `/users` | 생성 | `{email, name}` | `User` (201) / 이메일 중복 시 409 |
| PUT | `/users/{id}` | 전체 교체 (email, name 모두 필수) | `{email, name}` | `User` (200) / 없으면 404 / 다른 유저 이메일과 중복 시 409 |
| DELETE | `/users/{id}` | hard delete | - | (204) / 없으면 404 |

- `User`: `{ id: Long, email: String, name: String, createdAt: LocalDateTime, updatedAt: LocalDateTime }`
- `CreateUserRequest`: `{ email: String, name: String }` — email 은 이메일 형식 필수, name 은 공백만 불가
- `UpdateUserRequest`: `{ email: String, name: String }` — 두 필드 모두 필수 (전체 교체)

## 비즈니스 규칙
- 이메일은 전체 사용자 범위에서 유니크해야 한다 (중복 시 409).
- 이메일은 `email@domain.tld` 형식을 준수해야 한다.
- 이름은 공백만 입력할 수 없다 (빈 문자열 및 공백 문자만으로 구성된 값 거부).
- `PUT /users/{id}` 는 전체 교체이며 PATCH 아니다. email, name 두 필드 모두 필수다.
- `DELETE /users/{id}` 는 hard delete 로 수행되며 삭제된 사용자는 복구할 수 없다.
- V1 은 단일 사용자 모델이다. 권한/역할 분리는 포함하지 않으며 향후 인증/인가 피처 도입 시 확장한다.

## 관련 화면
- [screens/user-list.md](../screens/user-list.md)
- [screens/user-form.md](../screens/user-form.md)

## 비기능 요구사항
- 페이지네이션은 V1 에 적용하지 않는다 (전체 리스트 반환). 데이터 규모가 수백 건 이상으로 증가하기 전에 재검토한다.
- `/users/**` 엔드포인트는 현재 permitAll 로 공개되어 있다. 인증 피처 도입 시 접근 제어 정책을 재조정한다.
