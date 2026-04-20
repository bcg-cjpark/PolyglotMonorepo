import type { IconName } from './icons';

/**
 * UI 컴포넌트 기본 사이즈 타입
 */
export type ComponentSize = 'lg' | 'md' | 'sm';

/**
 * 내부에서 Icon을 사용하는 컴포넌트들의 공통 아이콘 props 타입
 */
export interface InnerIconProps {
  name: IconName;
  size?: ComponentSize | number;
  color?: string;
}

export type { IconName };
