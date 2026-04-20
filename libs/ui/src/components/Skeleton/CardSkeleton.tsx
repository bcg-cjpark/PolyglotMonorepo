import { memo } from 'react';
import { Skeleton } from './Skeleton';
import { TextSkeleton } from './TextSkeleton';
import { SkeletonIcons } from './SkeletonIcons';

export interface CardSkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

export const CardSkeleton = memo(function CardSkeleton({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
}: CardSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--base-colors-neutral-neutral200)] bg-[var(--base-colors-common-bg-surface-default)]">
      {showImage && (
        <div className="relative flex items-center justify-center">
          <Skeleton
            width="100%"
            height="200px"
            variant="rectangular"
            className="!rounded-none"
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <SkeletonIcons type="image" size="md" />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        {showTitle && <Skeleton width="70%" height="1.5rem" variant="text" className="mb-2" />}
        {showDescription && <TextSkeleton lines={2} lastLineWidth={80} />}
        {showActions && (
          <div className="mt-auto flex gap-3">
            <Skeleton
              width="80px"
              height="2rem"
              variant="rectangular"
              className="rounded-[var(--radius-sm)]"
            />
            <Skeleton
              width="60px"
              height="2rem"
              variant="rectangular"
              className="rounded-[var(--radius-sm)]"
            />
          </div>
        )}
      </div>
    </div>
  );
});
