import path from 'node:path';

/**
 * @monorepo/ui 소스를 앱 Vite에서 직접 번들할 때 resolve.alias에 주입.
 *  - UI 패키지 내부 import는 `#/` (libs/ui/src) 를 사용 (앱의 `@/` 와 충돌 방지).
 *  - `@monorepo/ui/styles.scss` → 글로벌 SCSS (main.tsx에서 import).
 *
 * @param {string} monorepoRoot 리포지토리 루트 절대 경로
 * @returns {Record<string, string>}
 */
export function uiPackageResolveAliases(monorepoRoot) {
  const root = path.resolve(monorepoRoot);
  const uiSrc = path.join(root, 'libs/ui/src');
  return {
    '@monorepo/ui/styles.scss': path.join(uiSrc, 'styles/components.scss'),
    '@monorepo/ui': path.join(uiSrc, 'index.ts'),
    '#': uiSrc,
  };
}
