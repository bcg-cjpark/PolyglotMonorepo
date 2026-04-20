import { Icon } from '#/components/Icon';
import type { InnerIconProps } from '#/types/components';
import { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { MobileListSwipeContext } from './MobileList';

export interface MobileListItemProps {
  clickable?: boolean;
  disabled?: boolean;
  divider?: boolean;
  selected?: boolean;
  secondaryAction?: InnerIconProps;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onSecondaryActionClick?: (e: React.MouseEvent) => void;
  onSwipeAction?: () => void;
}

const SWIPE_ACTION_WIDTH = 80;

export const MobileListItem = memo(function MobileListItem({
  clickable = false,
  disabled = false,
  divider = false,
  selected = false,
  secondaryAction,
  children,
  onClick,
  onSecondaryActionClick,
  onSwipeAction,
}: MobileListItemProps) {
  const swipeConfig = useContext(MobileListSwipeContext);
  const isSwipeEnabled = swipeConfig.enabled;
  const swipeThreshold = swipeConfig.threshold;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const justTriggered = useRef(false);

  const classes = useMemo(() => {
    const c = ['mobile-list-item'];
    if (clickable) c.push('mobile-list-item--clickable');
    if (disabled) c.push('mobile-list-item--disabled');
    if (divider) c.push('mobile-list-item--divider');
    if (selected) c.push('mobile-list-item--selected');
    if (isSwipeEnabled) c.push('mobile-list-item--swipeable');
    return c.join(' ');
  }, [clickable, disabled, divider, selected, isSwipeEnabled]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwipeEnabled || disabled) return;
      const t = e.targetTouches[0];
      touchStartX.current = t.clientX;
      touchStartY.current = t.clientY;
      isHorizontalSwipe.current = false;
    },
    [isSwipeEnabled, disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwipeEnabled || disabled) return;
      const t = e.targetTouches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      if (!isHorizontalSwipe.current) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) isHorizontalSwipe.current = true;
        else if (Math.abs(dy) > 10) return;
      }
      if (isHorizontalSwipe.current) {
        e.preventDefault();
        setSwipeOffset(Math.min(0, Math.max(-SWIPE_ACTION_WIDTH, dx)));
      }
    },
    [isSwipeEnabled, disabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isSwipeEnabled) return;
    if (swipeOffset <= -swipeThreshold) {
      justTriggered.current = true;
      onSwipeAction?.();
      setTimeout(() => {
        justTriggered.current = false;
      }, 300);
    }
    setSwipeOffset(0);
    isHorizontalSwipe.current = false;
  }, [isSwipeEnabled, swipeOffset, swipeThreshold, onSwipeAction]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (justTriggered.current) return;
      if (clickable) onClick?.(e);
    },
    [clickable, onClick]
  );

  const handleSecondaryClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.stopPropagation();
      onSecondaryActionClick?.(e);
    },
    [disabled, onSecondaryActionClick]
  );

  const content = (
    <>
      <div className="mobile-list-item__content">{children}</div>
      {secondaryAction && (
        <div className="mobile-list-item__secondary-action" onClick={handleSecondaryClick}>
          <Icon name={secondaryAction.name} size="md" />
        </div>
      )}
    </>
  );

  return (
    <li
      className={classes}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? (disabled ? -1 : 0) : undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {isSwipeEnabled ? (
        <>
          <div className="mobile-list-item__swipe-backdrop" aria-hidden="true">
            <Icon name="trash" size="md" className="mobile-list-item__swipe-icon" />
          </div>
          <div
            className="mobile-list-item__swipe-surface"
            style={{ transform: `translateX(${swipeOffset}px)` }}
          >
            {content}
          </div>
        </>
      ) : (
        <div className="mobile-list-item__swipe-surface">{content}</div>
      )}
    </li>
  );
});
