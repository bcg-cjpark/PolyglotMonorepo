# @monorepo/tokens

디자인 토큰 (CSS 변수 기반). **base 변수 정의만 소유**하며, Tailwind v4 `@theme` 매핑은
`@monorepo/tailwind-config` 가 소유한다.

## 사용 — 앱/스토리북에서 tokens + Tailwind 를 로드하는 방법

**정답**: entry CSS(또는 entry TS) 에서 `@monorepo/tailwind-config/globals` 한 줄만 import.

```ts
// apps/example-web/src/main.tsx
import '@monorepo/tailwind-config/globals';
```

```css
/* 또는 entry CSS */
@import '@monorepo/tailwind-config/globals.css';
```

이 한 줄이 `tokens-light.css` + `tokens-dark.css` 로드 + Tailwind `@theme inline` 매핑
활성 + `@tailwindcss/vite` 파이프라인 연결을 **단일 CSS graph 로** 수행한다.

### 왜 `@monorepo/tokens/styles.css` 를 직접 import 하면 안 되는가

Tailwind v4 는 `@theme` 블록을 **entry CSS 파일 그 자체의 AST** 에서만 인식한다.
JS 쪽에서 별도로 `import '@monorepo/tokens/styles.css'` 를 추가하면:

- 해당 CSS 가 별도 CSS graph 로 잡혀 `@theme inline` 이 pipeline 에서 누락
- `text-primary-primary500`, `rounded-md` 등 utility 가 빌드 산출물에서 사라짐
- dev 서버에서는 간헐적으로 동작해 버그 발견이 지연됨

이 때문에 `@monorepo/tokens` 패키지는 **더 이상 통합 엔트리(`styles.css`)를 export 하지 않는다**.
앱/스토리북은 반드시 `@monorepo/tailwind-config/globals` 를 사용할 것.

> 배경 커밋: `6491798 fix(build): Tailwind v4 @theme 매핑 단일 CSS graph 로 통합`

### 내부 파일을 직접 참조해야 할 때

특수 목적(테스트 유틸, 별도 번들 등)으로 테마 파일을 개별 import 해야 하면
`@monorepo/tokens/styles/*` subpath 로 가능 (단 Tailwind `@theme` 는 여전히 위 원칙을 따라야 함).

```css
@import '@monorepo/tokens/styles/tokens-light.css';
@import '@monorepo/tokens/styles/tokens-dark.css';
```

## 다크 모드 토글

```ts
document.documentElement.classList.toggle('dark');
```

`dark:` 유틸은 `globals.css` 에서 `@custom-variant dark (&:where(.dark, .dark *))`
로 정의되어 있어 문서 루트의 `.dark` 클래스 기준으로 동작한다.

`__tokens-dark.css` 내부의 토큰은 `:root[data-theme="dark"]` 셀렉터로 정의되어 있어
`data-theme` 속성도 병행 사용 가능하다.

## 구조

```
styles/
  tokens-light.css              # light 테마 (__tokens-light.css 래퍼)
  tokens-dark.css               # dark 테마
  __tokens-light.css            # 토큰 원본 — scripts/apply-theme-colors.mjs 경유 편집 필수
  __tokens-dark.css
  tailwind-bridge.css           # (DEPRECATED) 2026-04 기준 @theme 매핑은
                                # libs/tailwind-config/globals.css 로 이전됨.
                                # 파일은 scripts/apply-theme-colors.mjs 의
                                # secondary alias 삽입 경로 때문에 유지 중.
```

## 토큰 편집 / 브랜드 색 변경

`__tokens-{light,dark}.css` 는 **손으로 편집하지 않는다**. 브랜드 색 교체는 반드시
`scripts/apply-theme-colors.mjs` 를 경유한다.

```bash
# primary 만
node scripts/apply-theme-colors.mjs --primary=#4f46e5

# primary + secondary
node scripts/apply-theme-colors.mjs --primary=#4f46e5 --secondary=#f59e0b
```

스크립트는 HSL 보간으로 050–900 + `-deep` 11-step tonal scale 을 생성하고
light/dark 양쪽 토큰 파일을 일괄 갱신한다. semantic 토큰 중 브랜드 색 변경에
연동해야 하는 항목(`--button-primary-text`, `--button-light-solid-background-hover`)은
스크립트가 idempotent 로 재바인딩한다.

새 semantic 토큰이 Tailwind utility 로 노출되어야 하면 `libs/tailwind-config/globals.css`
의 `@theme inline` 블록에 alias(`--color-<name>`) 를 추가한다. `tokens` 패키지 내부에는
추가하지 않는다.

## 향후 개선

- [Tokens Studio](https://tokens.studio) + [Style Dictionary](https://styledictionary.com/)
  빌드 파이프라인을 도입해 `__tokens-*.css` 생성을 자동화.
- `tailwind-bridge.css` 는 `apply-theme-colors.mjs` 가 secondary alias 를 `globals.css`
  로 직접 삽입하도록 리팩터링되면 제거 가능.
