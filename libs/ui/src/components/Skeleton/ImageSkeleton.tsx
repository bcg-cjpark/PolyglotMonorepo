import { memo } from 'react';
import { Skeleton } from './Skeleton';
import { SkeletonIcons } from './SkeletonIcons';

export interface ImageSkeletonProps {
  showImage?: boolean;
  imageHeight?: string;
  imageWidth?: 'sm' | 'md' | 'lg' | 'full';
}

const WIDTH_MAP = { sm: '200px', md: '300px', lg: '400px', full: '100%' };

export const ImageSkeleton = memo(function ImageSkeleton({
  showImage = true,
  imageHeight = '200px',
  imageWidth = 'md',
}: ImageSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" role="status">
      {showImage && (
        <div className="relative flex shrink-0 items-center justify-center">
          <Skeleton
            width={WIDTH_MAP[imageWidth]}
            height={imageHeight}
            variant="rectangular"
            className="rounded-[var(--radius-sm)]"
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <SkeletonIcons type="image" size="md" />
          </div>
        </div>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
});
