import { memo } from 'react';
import { Skeleton } from './Skeleton';
import { SkeletonIcons } from './SkeletonIcons';

export interface IconSkeletonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  text?: string;
}

export const IconSkeleton = memo(function IconSkeleton({
  size = 'md',
  showText = false,
  text = 'Loading...',
}: IconSkeletonProps) {
  return (
    <div className="inline-flex items-center" role="status">
      <div className={`flex ${showText ? 'flex-row gap-4' : 'flex-col gap-3'} items-center`}>
        <div
          className={`icon-skeleton-${size} animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]`}
        >
          <SkeletonIcons type="user" size={size} />
        </div>
        {showText && <Skeleton width="60px" height="12px" variant="text" />}
      </div>
      <span className="sr-only">{text}</span>
    </div>
  );
});
