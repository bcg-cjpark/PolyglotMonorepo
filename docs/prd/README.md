# prd/ — 기획서 포맷 가이드

## 파일 네이밍

- `<feature-slug>.md` (예: `user-management.md`, `billing.md`, `auth.md`)
- 1 기능 = 1 파일.

## 필수 섹션 (에이전트가 이 헤딩을 grep 하므로 변경 금지)

```markdown
# <기능 이름>

## 개요
<한 문장으로 이 기능의 목적>

## 사용자 가치
- <사용자가 얻는 것, bullet>

## 도메인 모델
| Entity | Field | Type | Nullable | 설명 |
|---|---|---|---|---|
| User | id | Long | No | PK |
| User | email | String | No | 유니크, 로그인 ID |
| User | name | String | No |  |

## API 엔드포인트
| Method | Path | 설명 | Request | Response |
|---|---|---|---|---|
| GET | `/users` | 리스트 조회 | - | `User[]` |
| POST | `/users` | 생성 | `{email, name}` | `User` |

## 비즈니스 규칙
- 이메일 중복 불가
- <그 외 규칙>

## 관련 화면
- [screens/user-list.md](../screens/user-list.md)
- [screens/user-form.md](../screens/user-form.md)

## 비기능 요구사항 (선택)
- 응답 시간, 동시성, 보안 등 필요 시
```

## 작성 팁

- **도메인 모델 표**는 JPA 엔티티 / Flyway 마이그레이션 / OpenAPI 스키마의 source of truth. 정확하게.
- **API 엔드포인트 표**의 path/method/request/response 는 controller 코드와 1:1 대응.
- **관련 화면** 링크는 반드시 존재하는 파일을 가리킬 것 (에이전트가 broken link 감지).
