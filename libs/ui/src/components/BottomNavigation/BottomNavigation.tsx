import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { memo, useMemo, useCallback } from 'react';

export interface BottomNavigationItem {
  /** 아이템의 고유 값 */
  value: string | number;
  /** 아이템 라벨 */
  label: string;
  /** 아이콘 이름 */
  icon: IconName;
  /** 아이콘 크기 */
  iconSize?: 'sm' | 'md' | 'lg';
  /** 아이콘 색상 */
  iconColor?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export interface BottomNavigationProps {
  /** 네비게이션 아이템 배열 */
  items: BottomNavigationItem[];
  /** 현재 선택된 아이템의 값 */
  value?: string | number;
  /** 라벨 표시 여부 (3개 이하일 때는 자동으로 true) */
  showLabels?: boolean;
  /** 선택 변경 시 */
  onChange?: (value: string | number, item: BottomNavigationItem) => void;
}

export const BottomNavigation = memo(function BottomNavigation({
  items,
  value,
  showLabels,
  onChange,
}: BottomNavigationProps) {
  const shouldShowLabels = useMemo(() => {
    if (showLabels !== undefined) return showLabels;
    return items.length <= 3;
  }, [showLabels, items.length]);

  const navigationClasses = useMemo(() => {
    return `base-bottom-navigation ${shouldShowLabels ? 'base-bottom-navigation--with-labels' : 'base-bottom-navigation--icons-only'}`;
  }, [shouldShowLabels]);

  const handleItemClick = useCallback(
    (item: BottomNavigationItem) => {
      if (item.disabled) return;
      onChange?.(item.value, item);
    },
    [onChange]
  );

  const getIconSize = (iconSize?: string) => {
    if (iconSize === 'sm') return 'sm' as const;
    if (iconSize === 'lg') return 'lg' as const;
    return 'md' as const;
  };

  return (
    <nav className={navigationClasses} role="navigation" aria-label="하단 네비게이션">
      <div className="base-bottom-navigation__container">
        {items.map((item) => {
          const isActive = value === item.value;
          return (
            <button
              key={item.value}
              className={[
                'base-bottom-navigation__item',
                isActive ? 'base-bottom-navigation__item--active' : '',
                item.disabled ? 'base-bottom-navigation__item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={item.disabled}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleItemClick(item)}
            >
              <div className="base-bottom-navigation__icon">
                <Icon
                  name={item.icon}
                  size={getIconSize(item.iconSize)}
                  color={item.iconColor}
                />
              </div>
              {shouldShowLabels && (
                <span className="base-bottom-navigation__label">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
