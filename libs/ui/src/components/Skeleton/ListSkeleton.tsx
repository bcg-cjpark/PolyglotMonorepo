import { memo, useMemo } from 'react';
import { Skeleton } from './Skeleton';
import { IconSkeleton } from './IconSkeleton';

export interface ListSkeletonProps {
  /** 리스트 아이템 수 */
  items?: number;
  /** 아바타 표시 여부 */
  showAvatar?: boolean;
  /** 부제목 표시 여부 */
  showSubtitle?: boolean;
  /** 액션 버튼 표시 여부 */
  showAction?: boolean;
  /** 리스트 스타일 */
  variant?: 'default' | 'bordered' | 'card';
}

export const ListSkeleton = memo(function ListSkeleton({
  items = 5,
  showAvatar = true,
  showSubtitle = true,
  showAction = true,
  variant = 'default',
}: ListSkeletonProps) {
  const itemArray = useMemo(() => Array.from({ length: items }, (_, i) => i), [items]);

  const containerClass =
    variant === 'default'
      ? 'flex flex-col gap-6'
      : variant === 'bordered'
        ? 'flex flex-col border border-[var(--base-colors-neutral-neutral200)] rounded-[var(--radius-sm)] overflow-hidden'
        : 'flex flex-col gap-4';

  return (
    <div className="flex flex-col" role="status">
      <div className={containerClass}>
        {itemArray.map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-5 p-5 ${
              variant === 'bordered' && index < itemArray.length - 1
                ? 'border-b border-[var(--base-colors-neutral-neutral200)]'
                : ''
            }`}
          >
            <div className="flex flex-1 items-center gap-5">
              {showAvatar && <IconSkeleton size="md" />}
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton width="120px" height="16px" variant="text" />
                {showSubtitle && <Skeleton width="80px" height="12px" variant="text" />}
              </div>
            </div>
            {showAction && <Skeleton width="60px" height="16px" variant="text" />}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
});
