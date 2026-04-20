import { memo, useMemo } from 'react';

export type BadgeColor = 'grey' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
export type BadgeVariant = 'dot' | 'standard' | 'square';
export type BadgeOverlap = 'overlap' | 'no-overlap';
export type BadgeVertical = 'top' | 'middle' | 'bottom';
export type BadgeHorizontal = 'left' | 'right';

export interface BadgeAnchorOrigin {
  vertical: BadgeVertical;
  horizontal: BadgeHorizontal;
}

export interface BadgeProps {
  /** 배지에 표시할 값 */
  value?: number;
  /** 최대값 (숫자일 때만 적용) */
  max?: number;
  /** 배지 스타일 */
  variant?: BadgeVariant;
  /** 배지 색상 */
  color?: BadgeColor;
  /** 0일 때도 표시할지 여부 */
  showZero?: boolean;
  /** 배지 숨김 여부 */
  hidden?: boolean;
  /** 배지 겹침 여부 */
  overlap?: BadgeOverlap;
  /** 배지 위치 */
  anchorOrigin?: BadgeAnchorOrigin;
  /** children */
  children?: React.ReactNode;
}

export const Badge = memo(function Badge({
  value = 0,
  max = 99,
  variant = 'standard',
  color = 'red',
  showZero = false,
  hidden = false,
  overlap = 'overlap',
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
  children,
}: BadgeProps) {
  const shouldShowBadge = useMemo(() => {
    if (hidden) return false;
    if (variant === 'dot') return true;
    return showZero ? true : value > 0;
  }, [hidden, variant, showZero, value]);

  const displayValue = useMemo(() => {
    if (variant === 'dot') return undefined;
    if (typeof value === 'number') {
      return value > max ? `${max}+` : value;
    }
    return value;
  }, [variant, value, max]);

  // square variant는 항상 no-overlap, middle-right
  const effectiveOverlap: BadgeOverlap = variant === 'square' ? 'no-overlap' : overlap;
  const effectiveAnchor: BadgeAnchorOrigin =
    variant === 'square' ? { vertical: 'middle', horizontal: 'right' } : anchorOrigin;

  const badgeClasses = [
    'base-badge',
    `base-badge--${variant}`,
    `base-badge--${color}`,
    `base-badge--${effectiveOverlap}`,
    `base-badge--${effectiveAnchor.vertical}-${effectiveAnchor.horizontal}`,
  ].join(' ');

  return (
    <div className={`base-badge-wrapper base-badge-wrapper--${overlap}`}>
      {children}
      {shouldShowBadge && <span className={badgeClasses}>{displayValue}</span>}
    </div>
  );
});
