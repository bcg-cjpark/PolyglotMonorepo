import { Icon } from '#/components/Icon';
import type { InnerIconProps } from '#/types/components';
import { memo, useCallback, useMemo } from 'react';

export interface ListItemProps {
  /** 클릭 가능 여부 */
  clickable?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 하단 구분선 표시 */
  divider?: boolean;
  /** 선택된 상태 */
  selected?: boolean;
  /** 우측 보조 액션 아이콘 */
  secondaryAction?: InnerIconProps;
  /** 콘텐츠 */
  children?: React.ReactNode;
  /** 클릭 시 */
  onClick?: (e: React.MouseEvent) => void;
  /** 보조 액션 클릭 시 */
  onSecondaryActionClick?: (e: React.MouseEvent) => void;
}

export const ListItem = memo(function ListItem({
  clickable = false,
  disabled = false,
  divider = false,
  selected = false,
  secondaryAction,
  children,
  onClick,
  onSecondaryActionClick,
}: ListItemProps) {
  const classes = useMemo(() => {
    const c = ['list-item'];
    if (clickable) c.push('list-item--clickable');
    if (disabled) c.push('list-item--disabled');
    if (divider) c.push('list-item--divider');
    if (selected) c.push('list-item--selected');
    return c.join(' ');
  }, [clickable, disabled, divider, selected]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.(e as unknown as React.MouseEvent);
      }
    },
    [clickable, onClick]
  );

  return (
    <li
      className={classes}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? (disabled ? -1 : 0) : undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center">
        <div className="list-item__content">{children}</div>
        {secondaryAction && (
          <div className="list-item__secondary-action" onClick={handleSecondaryClick}>
            <Icon name={secondaryAction.name} size="md" />
          </div>
        )}
      </div>
    </li>
  );
});
