import { memo, createContext, useMemo } from 'react';

export interface MobileListSwipeConfig {
  enabled: boolean;
  threshold: number;
}

export const MobileListSwipeContext = createContext<MobileListSwipeConfig>({
  enabled: true,
  threshold: 80,
});

export interface MobileListProps {
  /** 서브헤더 텍스트 */
  subheader?: string;
  /** 리스트 아이템 간격 */
  gap?: string;
  /** 스와이프 액션 사용 여부 */
  swipeAction?: boolean;
  /** 스와이프 임계 거리(px) */
  swipeThreshold?: number;
  children?: React.ReactNode;
}

export const MobileList = memo(function MobileList({
  subheader,
  gap = '0px',
  swipeAction = true,
  swipeThreshold = 80,
  children,
}: MobileListProps) {
  const config = useMemo<MobileListSwipeConfig>(
    () => ({ enabled: swipeAction, threshold: swipeThreshold }),
    [swipeAction, swipeThreshold]
  );

  return (
    <MobileListSwipeContext.Provider value={config}>
      <ul
        className="base-mobile-list"
        style={{ '--list-gap': gap } as React.CSSProperties}
        role="list"
      >
        {subheader && (
          <div className="base-mobile-list__subheader" role="heading" aria-level={3}>
            {subheader}
          </div>
        )}
        <div className="base-mobile-list__items">{children}</div>
      </ul>
    </MobileListSwipeContext.Provider>
  );
});
