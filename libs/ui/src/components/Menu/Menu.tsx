import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import {
  Menu as HUIMenu,
  MenuButton as HUIMenuButton,
  MenuItems as HUIMenuItems,
  MenuItem as HUIMenuItem,
  Transition,
} from '@headlessui/react';
import { memo, Fragment } from 'react';

/**
 * 메뉴 아이템 타입 정의
 */
export interface MenuItemType {
  /** 메뉴 아이템 라벨 */
  label: string;
  /** 아이콘 이름 */
  icon?: IconName;
  /** 메뉴 아이템 값 */
  value?: unknown;
}

export interface MenuProps {
  /** 메뉴 아이템 배열 */
  items: MenuItemType[];
  /** 아이콘 표시 여부 */
  showIcons?: boolean;
  /** 메뉴 너비 (px) */
  menuWidth?: number;
  /** 정렬 */
  align?: 'center' | 'left' | 'right';
  /** MenuItems 컨테이너에 추가할 클래스 */
  itemsClass?: string;
  /** 메뉴 아이템 위쪽에 표시할 영역 */
  prepend?: React.ReactNode;
  /** 트리거 요소 */
  children: React.ReactNode;
  /** 메뉴 아이템 선택 시 */
  onSelect?: (item: MenuItemType) => void;
}

export const Menu = memo(function Menu({
  items,
  showIcons = false,
  menuWidth = 180,
  align = 'center',
  itemsClass,
  prepend,
  children,
  onSelect,
}: MenuProps) {
  const getAlignClasses = () => {
    switch (align) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  return (
    <HUIMenu as="div" className="relative inline-block">
      <HUIMenuButton as={Fragment}>{children}</HUIMenuButton>

      <Transition
        as={Fragment}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-in"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <HUIMenuItems
          className={[
            'base-menu__items absolute z-50 mt-2 flex flex-col overflow-hidden rounded-md bg-[var(--background-bg-default)]',
            getAlignClasses(),
            itemsClass ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: `${menuWidth}px` }}
        >
          {/* prepend 영역 */}
          {prepend && <div className="base-menu__prepend shrink-0 p-1">{prepend}</div>}

          {items.map((item) => (
            <HUIMenuItem key={item.label}>
              <button
                type="button"
                className="base-menu__item w-full text-left"
                onClick={() => onSelect?.(item)}
              >
                <div className="base-menu__item-content">
                  {showIcons && item.icon && (
                    <Icon name={item.icon} size="sm" color="var(--font-color-default)" />
                  )}
                  <span className="base-menu__item-text">{item.label}</span>
                </div>
              </button>
            </HUIMenuItem>
          ))}
        </HUIMenuItems>
      </Transition>
    </HUIMenu>
  );
});
