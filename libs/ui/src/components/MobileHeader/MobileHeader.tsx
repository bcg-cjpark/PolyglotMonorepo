import { IconButton } from '#/components/IconButton';
import type { IconName } from '#/types/icons';
import { memo } from 'react';

export interface MobileHeaderProps {
  /** 헤더에 표시할 타이틀 */
  title?: string;
  /** 우측 아이콘 표시 여부 */
  showRightIcon?: boolean;
  /** 우측 아이콘 이름 */
  rightIcon?: IconName;
  /** 알림 배지 표시 여부 */
  showNotificationBadge?: boolean;
  /** 좌측 커스텀 렌더 */
  renderLeft?: React.ReactNode;
  /** 중앙 커스텀 렌더 */
  renderCenter?: React.ReactNode;
  /** 우측 아이콘 클릭 시 */
  onRightIconClick?: () => void;
}

export const MobileHeader = memo(function MobileHeader({
  title = '',
  showRightIcon = true,
  rightIcon = 'notification',
  showNotificationBadge = false,
  renderLeft,
  renderCenter,
  onRightIconClick,
}: MobileHeaderProps) {
  return (
    <div className="flex h-[50px] w-full items-center justify-between px-4 py-2.5">
      {/* 좌측 */}
      <div className="flex min-w-[80px] items-center gap-2">{renderLeft}</div>

      {/* 중앙 */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        {renderCenter ?? (
          <h1 className="m-0 text-lg font-medium leading-[100%] tracking-[-0.35px] text-[var(--font-color-default,#131313)]">
            {title}
          </h1>
        )}
      </div>

      {/* 우측 */}
      <div className="flex min-w-[80px] items-center justify-end">
        {showRightIcon && (
          <IconButton
            icon={{ name: rightIcon, size: 'md' }}
            shape="square"
            padding="0px"
            size="md"
            badge={{ value: 0, variant: 'dot', hidden: !showNotificationBadge }}
            onClick={onRightIconClick}
          />
        )}
      </div>
    </div>
  );
});
