# stitch-brief/ — Stitch 투입 브리프

기획팀의 `stitch-brief-writer` 에이전트가 통합 PRD 를 바탕으로 외부 Stitch
(또는 대체 UX 디자인 툴) 에 투입할 시스템 프롬프트/페이지 리스트/컴포넌트 의도를
정리해 이 디렉터리에 `<feature>.md` 형태로 저장한다.

## 파일 네이밍

- `<feature-slug>.md` (예: `user-management.md`, `todo.md`)
- 관련 PRD 한 개와 1:1 대응.

## 표준 섹션 (`stitch-brief-writer` 가 생성하는 템플릿)

```markdown
# Stitch Brief: <feature-name>

**원본 PRD**: `docs/prd/<feature>.md`
**디자인 노트**: `docs/design-notes/<feature>.md` (있으면)

## 프로덕트 컨텍스트
<한 단락. 톤/맥락.>

## 전체 페이지 리스트
- **페이지 이름**: <PascalCase, 예: UserListPage>
- **Route**: <예: /users>
- **목적**: <한줄>
- **필요 UI 카테고리** (구현체 언급 금지): ...
- **주요 인터랙션**: ...
- **데이터 바인딩 대상 API**: ...

## 디자인 제약
- 토큰 기반 (하드코딩 색/간격 금지)
- Light/Dark 양쪽 대응
- 한글 IME 필요 필드 명시

## 비포함 (Out of scope)
- PRD 에 없는 기능은 생성되지 않도록 지침.

## 사용자 수동 투입 가이드
1. Stitch (또는 대체 툴) 에 위 브리프를 시스템 프롬프트로 투입.
2. 페이지별 결과(HTML/이미지/프레임) 를 수작업으로 `docs/screens/<feature>-<page>.md` 로 변환.
3. `docs/screens/README.md` 의 "UI 카테고리만 명시" 원칙 준수.
```

## 원칙

- **구현체 언급 금지** — "Input", "Button", "native textarea" 같은 구현명 금지. UI 카테고리 (단일행 텍스트 입력, Primary 버튼 등) 로만.
- **PRD 에 없는 정보 금지** — 브리프는 요약이고, 새 요구사항을 만들지 않는다.
- **1파일 1 기능**.
- **Stitch 교체 유연성** — Figma AI, Galileo 등 대체 툴에도 동일 구조 사용 가능.
