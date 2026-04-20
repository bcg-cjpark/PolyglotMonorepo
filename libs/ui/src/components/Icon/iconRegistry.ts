/**
 * 아이콘 레지스트리
 * import.meta.glob을 활용하여 모든 SVG 아이콘을 raw string으로 import
 */

// 일반 아이콘들
const iconModules = import.meta.glob('../../assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// 플래그 아이콘들
const flagModules = import.meta.glob('../../assets/icons/flags/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// 트레이드 아이콘들
const tradeModules = import.meta.glob('../../assets/icons/trade/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// 알림 아이콘들
const notificationModules = import.meta.glob('../../assets/icons/notification/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// 아이콘 이름을 키로 하는 매핑 생성
export const iconRegistry = new Map<string, string>();

/**
 * SVG 태그에서 width/height 속성을 제거하여 CSS로 크기 제어가 가능하게 함
 * viewBox는 유지하여 비율이 깨지지 않도록 함
 */
function sanitizeSvg(raw: string): string {
  return raw.replace(/<svg([^>]*)>/, (match, attrs: string) => {
    const cleaned = attrs.replace(/\s*width="[^"]*"/g, '').replace(/\s*height="[^"]*"/g, '');
    return `<svg${cleaned}>`;
  });
}

function registerModules(modules: Record<string, unknown>) {
  Object.entries(modules).forEach(([path, raw]) => {
    const name = path.split('/').pop()?.replace('.svg', '');
    if (name && typeof raw === 'string') {
      iconRegistry.set(name, sanitizeSvg(raw));
    }
  });
}

registerModules(iconModules);
registerModules(flagModules);
registerModules(tradeModules);
registerModules(notificationModules);

/**
 * 아이콘 SVG raw string 가져오기
 */
export const getIconSvg = (name: string): string | null => {
  return iconRegistry.get(name) || null;
};
