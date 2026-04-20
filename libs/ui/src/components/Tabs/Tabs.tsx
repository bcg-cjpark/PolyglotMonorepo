import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { memo, useMemo } from 'react';

export type TabVariant = 'underline' | 'inner' | 'button';
export type TabsSize = 'lg' | 'md';

export interface TabItem {
  key: string;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  /** 탭 패널에 렌더링할 React 노드 */
  panel?: React.ReactNode;
}

export interface TabsProps {
  /** 탭 아이템 배열 */
  tabs: TabItem[];
  /** 현재 선택된 탭 key */
  value?: string;
  /** 탭 스타일 variant */
  variant?: TabVariant;
  /** 크기 */
  size?: TabsSize;
  /** 밑줄 여부 (underline variant) */
  underline?: boolean;
  /** 배경색 여부 (underline variant) */
  hasBackground?: boolean;
  /** 전체 너비 사용 여부 */
  fullwidth?: boolean;
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** 탭 변경 시 */
  onChange?: (key: string) => void;
}

function getTabButtonClasses(
  selected: boolean,
  disabled: boolean,
  variant: TabVariant,
  size: TabsSize,
  fullwidth: boolean,
  underline: boolean,
  hasBackground: boolean
): string {
  const baseClasses = `focus:outline-none focus:ring-0 flex items-center gap-x-2 ${fullwidth && variant !== 'button' ? 'flex-1 justify-center' : ''}`;

  if (disabled) {
    if (variant === 'inner') {
      return `${baseClasses} opacity-50 cursor-not-allowed px-3 py-1.5 text-[13px] leading-[16px] tracking-tight text-[var(--button-tab-text-off)]`;
    }
    if (variant === 'button') {
      return `${baseClasses} opacity-50 cursor-not-allowed whitespace-nowrap px-3 py-1.5 text-[13px] leading-[16px] rounded-full bg-[var(--button-disabled-background)] text-[var(--font-color-default-muted)]`;
    }
    const sz =
      size === 'lg' ? 'py-3 px-6 text-base font-semibold' : 'px-4 py-3 text-sm font-medium';
    return `${baseClasses} opacity-50 cursor-not-allowed ${sz} text-default-muted-dark`;
  }

  if (variant === 'button') {
    return [
      baseClasses,
      'whitespace-nowrap px-4 py-2 text-[12px] leading-[16px] tracking-tight rounded-full font-medium',
      selected
        ? 'bg-[var(--button-primary-background)] text-[var(--button-primary-text)]'
        : 'bg-[var(--button-disabled-background)] text-[var(--font-color-default-muted)]',
    ].join(' ');
  }

  if (variant === 'inner') {
    return [
      baseClasses,
      'px-3 py-1.5 text-[13px] leading-[16px] tracking-tight',
      selected
        ? 'bg-[var(--button-tab-button-on)] text-[var(--button-tab-text-on)] rounded-xs font-medium'
        : 'text-[var(--button-tab-text-off)]',
    ].join(' ');
  }

  // underline
  const sizeClasses =
    size === 'lg'
      ? selected
        ? 'py-3 px-6 text-base font-semibold'
        : 'py-3 px-6 text-base font-normal'
      : selected
        ? 'px-4 py-3 text-sm font-medium'
        : 'px-4 py-3 text-sm font-normal';

  const textColor = selected
    ? 'bg-bg-bg-default text-default'
    : hasBackground
      ? 'bg-bg-bg-surface text-default-muted-dark'
      : 'bg-bg-bg-default text-default-muted-dark';

  const underlineClasses = selected
    ? size === 'lg'
      ? 'shadow-[inset_0_-3px_0_0_var(--input-color-border-focus)]'
      : 'shadow-[inset_0_-2px_0_0_var(--input-color-border-focus)]'
    : underline
      ? size === 'lg'
        ? 'shadow-[inset_0_-3px_0_0_var(--background-bg-outline)]'
        : 'shadow-[inset_0_-2px_0_0_var(--background-bg-outline)]'
      : '';

  return [baseClasses, 'whitespace-nowrap', sizeClasses, textColor, underlineClasses]
    .filter(Boolean)
    .join(' ');
}

function getContainerClasses(variant: TabVariant, fullwidth: boolean): string {
  if (variant === 'inner') return 'flex p-1 bg-neutral-neutral050 rounded-[6px] gap-x-[10px]';
  if (variant === 'button') return fullwidth ? 'flex w-full gap-x-1' : 'flex flex-nowrap gap-x-1';
  return fullwidth ? 'flex w-full' : 'flex flex-nowrap';
}

export const Tabs = memo(function Tabs({
  tabs,
  value = '',
  variant = 'underline',
  size = 'lg',
  underline = false,
  hasBackground = false,
  fullwidth = false,
  ariaLabel = '탭 목록',
  onChange,
}: TabsProps) {
  const selectedIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.key === value);
    return idx >= 0 ? idx : 0;
  }, [tabs, value]);

  const handleChange = (index: number) => {
    const tab = tabs[index];
    if (tab && !tab.disabled) {
      onChange?.(tab.key);
    }
  };

  const tabListClasses = fullwidth ? 'flex' : 'flex items-center';
  const containerClasses = getContainerClasses(variant, fullwidth);

  return (
    <TabGroup selectedIndex={selectedIndex} onChange={handleChange}>
      <TabList className={tabListClasses} aria-label={ariaLabel}>
        <div className={containerClasses}>
          {tabs.map((tab) => (
            <Tab key={tab.key} disabled={tab.disabled}>
              {({ selected }) => (
                <button
                  type="button"
                  className={getTabButtonClasses(
                    selected,
                    !!tab.disabled,
                    variant,
                    size,
                    fullwidth,
                    underline,
                    hasBackground
                  )}
                  disabled={tab.disabled}
                >
                  {tab.icon && <Icon name={tab.icon} />}
                  {tab.label}
                </button>
              )}
            </Tab>
          ))}
        </div>
      </TabList>

      <TabPanels className="mt-2">
        {tabs.map((tab) => (
          <TabPanel key={tab.key} className="bg-bg-bg-default rounded-xl p-3" tabIndex={0}>
            {tab.panel ?? <div className="text-center text-gray-500">탭 컨텐츠가 없습니다.</div>}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
});
