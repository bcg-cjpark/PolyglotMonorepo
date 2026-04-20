import { memo, useMemo } from 'react';

export interface SkeletonProps {
  /** 스켈레톤 너비 */
  width?: string;
  /** 스켈레톤 높이 */
  height?: string;
  /** 스켈레톤 스타일 */
  variant?: 'text' | 'circular' | 'rectangular';
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  className,
}: SkeletonProps) {
  const classes = useMemo(() => {
    const c = ['skeleton-base', 'animate-pulse'];
    if (variant === 'circular') c.push('skeleton-circular');
    else if (variant === 'rectangular') c.push('skeleton-rectangular');
    else c.push('skeleton-text');
    if (className) c.push(className);
    return c.join(' ');
  }, [variant, className]);

  return <div className={classes} style={{ width, height }} />;
});
