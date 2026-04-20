/**
 * 앱 레벨 테마 런타임 공통 계약.
 * 구현체(`useTheme`)는 각 앱에만 둡니다.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UseThemeResult {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
}
