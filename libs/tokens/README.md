# @monorepo/tokens

디자인 토큰 (CSS 변수 기반).

## 사용

```ts
// apps/example-web/src/main.tsx 또는 globals.css
import "@monorepo/tokens/styles.css";
```

`styles.css`는 light/dark 테마를 모두 포함하며, `:root[data-theme="..."]` 셀렉터로 분기됩니다.

## 다크 모드 토글

```ts
document.documentElement.setAttribute("data-theme", "dark");
// 또는
document.documentElement.setAttribute("data-theme", "light");
```

## 구조

```
styles.css                      # 통합 엔트리 (아래 파일들 @import)
styles/
  tokens-light.css              # light 테마 (__tokens-light.css 래퍼)
  tokens-dark.css               # dark 테마
  __tokens-light.css            # Tokens Studio 원본 변환 결과 (손으로 편집하지 말 것)
  __tokens-dark.css
  tailwind-bridge.css           # CSS 변수 → Tailwind @theme 매핑
```

## 향후 개선

현재는 `react-monorepo-template`에서 컴파일된 CSS를 그대로 복사한 상태. 필요 시
[Tokens Studio](https://tokens.studio) + [Style Dictionary](https://styledictionary.com/)
빌드 파이프라인을 도입할 수 있음 (원본 레포 참조).
