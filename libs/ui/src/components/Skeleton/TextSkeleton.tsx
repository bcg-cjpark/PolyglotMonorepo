import { memo, useMemo } from 'react';
import { Skeleton } from './Skeleton';

export interface TextSkeletonProps {
  /** 텍스트 라인 수 */
  lines?: number;
  /** 마지막 라인 너비 비율 (0-100) */
  lastLineWidth?: number;
}

export const TextSkeleton = memo(function TextSkeleton({
  lines = 1,
  lastLineWidth = 60,
}: TextSkeletonProps) {
  const lineArray = useMemo(() => Array.from({ length: lines }, (_, i) => i), [lines]);

  return (
    <div className="flex flex-col gap-3">
      {lineArray.map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? `${lastLineWidth}%` : '100%'}
          height="1rem"
          variant="text"
          className="mb-2"
        />
      ))}
    </div>
  );
});
