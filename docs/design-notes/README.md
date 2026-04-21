# design-notes/ — 디자인 톤/트렌드 노트

디자인팀의 `design-trend-scout` 에이전트가 프로덕트 톤/트렌드/레퍼런스를 리서치해서
이 디렉터리에 `<feature>.md` 형태로 저장한다.

UI팀이 실제 토큰/primitive 를 편집할 때 이 노트를 참조해 의도를 실행.

## 파일 네이밍

- `<feature-slug>.md` 또는 `global-<topic>.md` (예: `todo.md`, `global-typography.md`)

## 표준 섹션

```markdown
# Design Notes: <feature-name>

**원본 PRD**: `docs/prd/<feature>.md`
**작성일**: YYYY-MM-DD

## 프로덕트 톤 (의도)
<한 단락.>

## 레퍼런스
| # | 이름 | URL / 스샷 경로 | 차용 포인트 |
|---|---|---|---|
| 1 | Linear 이슈 리스트 | https://... | 고정폭 레이아웃 |

## 팔레트 의도
- Primary: <역할/감각>
- Secondary: <역할/감각>

**UI팀 실행 요청**: Primary/Secondary HEX → `scripts/apply-theme-colors.mjs`

## 타이포그래피 / 스케일
- 본문: 14/16
- 헤더: 24/20/16

## 레이아웃 & 간격
- 여백 리듬, 카드 간격 의도

## 모션
- transition duration 기본

## 접근성 / 다국어
- 한글 폰트 폴백, 대비 기준, IME 필드

## 구현 제약 (UI팀/프론트 개발팀 전달)
- 하드코딩 금지, Light/Dark 양쪽 대응, libs/ui 우선

## Out of Scope
```

## 원칙

- **바이너리 이미지 커밋 금지** — 외부 링크 또는 짧은 설명.
- **실행 책임 명시** — 토큰 변경/primitive 추가가 필요하면 "UI팀 실행 요청" 블록.
- **PRD 이탈 금지** — 새 기능 제안 금지, 톤 결정만.
- **추측 금지** — 미정 항목은 `<미정>` 으로 남기고 사용자/논의 요청.
