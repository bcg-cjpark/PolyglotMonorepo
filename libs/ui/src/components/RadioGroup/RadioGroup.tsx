import { Chip } from '#/components/Chip';
import type { ChipVariant } from '#/components/Chip';
import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { RadioGroup as HUIRadioGroup, Radio as HUIRadio, Label as HUILabel } from '@headlessui/react';
import { memo, useMemo } from 'react';

export interface RadioOption<T = unknown> {
  value: T;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  chipLabel?: string;
  chipVariant?: ChipVariant;
  chipRounded?: string;
}

export interface RadioGroupProps {
  /** 선택된 값 */
  value?: unknown;
  /** 라디오 옵션 목록 */
  options: RadioOption[];
  /** 라디오 그룹 라벨 */
  label?: string;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 스타일 variant */
  variant?: 'default' | 'underline';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 폼 name 속성 */
  name?: string;
  /** 전체 너비 사용 여부 (underline) */
  fullwidth?: boolean;
  /** 비선택 항목 밑줄 제거 (underline) */
  noUnderline?: boolean;
  /** 허용된 옵션 인덱스 목록 */
  allowedList?: number[];
  /** 가로 스크롤 허용 */
  scrollable?: boolean;
  /** 값 변경 시 */
  onChange?: (value: unknown) => void;
}

function getOptionClasses(
  checked: boolean,
  active: boolean,
  disabled: boolean,
  variant: 'default' | 'underline',
  size: 'sm' | 'md',
  fullwidth: boolean,
  noUnderline: boolean,
  scrollable: boolean
): string {
  const shrinkClass = scrollable ? 'flex-shrink-0' : '';
  const baseClasses =
    `focus:outline-none focus:ring-0 flex items-center gap-x-2 ${shrinkClass} ${fullwidth ? 'flex-1 justify-center' : ''}`.trim();

  if (variant === 'underline') {
    if (disabled) {
      const sz =
        size === 'sm' ? 'px-4 py-3 text-sm font-medium' : 'py-3 px-6 text-base font-semibold';
      return `${baseClasses} opacity-50 cursor-not-allowed ${sz} text-default-muted-dark`;
    }
    const sz =
      size === 'sm' ? 'px-4 py-3 text-sm font-medium' : 'py-3 px-6 text-base font-semibold';
    const textColor = checked
      ? 'bg-bg-bg-default text-default font-semibold'
      : 'bg-bg-bg-default text-default-muted-dark';
    const underline = checked
      ? size === 'sm'
        ? 'shadow-[inset_0_-2px_0_0_var(--input-color-border-focus)]'
        : 'shadow-[inset_0_-3px_0_0_var(--input-color-border-focus)]'
      : noUnderline
        ? ''
        : size === 'sm'
          ? 'shadow-[inset_0_-1px_0_0_var(--background-bg-outline)]'
          : 'shadow-[inset_0_-2px_0_0_var(--background-bg-outline)]';
    return [baseClasses, 'whitespace-nowrap', sz, textColor, underline].filter(Boolean).join(' ');
  }

  // default variant
  const sizeClass = size === 'sm' ? 'h-[28px]' : 'h-[34px]';
  const defaultBase = `${baseClasses} justify-center ${sizeClass} px-3 text-[13px] leading-[16px] tracking-tight rounded-xs transition-colors duration-200 whitespace-nowrap`;

  if (disabled)
    return `${defaultBase} opacity-50 cursor-not-allowed text-[var(--button-tab-text-off)]`;
  if (checked)
    return `${defaultBase} bg-[var(--button-tab-button-on)] text-[var(--button-tab-text-on)] font-semibold`;
  if (active)
    return `${defaultBase} bg-[var(--button-tab-button-hover)] text-[var(--button-tab-text-on)]`;
  return `${defaultBase} text-[var(--button-tab-text-off)] hover:bg-[var(--button-tab-button-hover)] hover:text-[var(--button-tab-text-on)]`;
}

export const RadioGroup = memo(function RadioGroup({
  value,
  options,
  label,
  size = 'md',
  variant = 'default',
  disabled = false,
  name,
  fullwidth = false,
  noUnderline = false,
  allowedList,
  scrollable = false,
  onChange,
}: RadioGroupProps) {
  const containerClasses = useMemo(() => {
    if (variant === 'underline') {
      if (scrollable) return 'flex w-full min-w-max flex-nowrap';
      return fullwidth ? 'flex w-full' : 'flex flex-nowrap';
    }
    if (scrollable)
      return 'bg-neutral-neutral050 flex w-full min-w-max flex-nowrap gap-x-[5px] rounded-[6px] py-1 px-1';
    return 'bg-neutral-neutral050 flex gap-x-[5px] rounded-[6px] py-1 px-1';
  }, [variant, scrollable, fullwidth]);

  const scrollWrapperClasses = scrollable ? 'w-full min-w-0 overflow-x-auto overflow-y-hidden' : '';

  return (
    <div className={`w-full ${scrollable ? 'min-w-0' : ''}`}>
      <HUIRadioGroup
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        className="space-y-2"
      >
        {label && (
          <HUILabel className="block text-sm font-medium text-[var(--font-color-default)]">
            {label}
          </HUILabel>
        )}

        <div className={scrollWrapperClasses}>
          <div className={containerClasses}>
            {options.map((option, index) => {
              const isDisabled =
                option.disabled ||
                disabled ||
                (allowedList !== undefined && !allowedList.includes(index));

              return (
                <HUIRadio key={String(option.value)} value={option.value} disabled={isDisabled}>
                  {({ checked, hover, focus }) => (
                    <button
                      type="button"
                      className={getOptionClasses(
                        checked,
                        hover || focus,
                        isDisabled,
                        variant,
                        size,
                        fullwidth,
                        noUnderline,
                        scrollable
                      )}
                      disabled={isDisabled}
                    >
                      {option.icon && <Icon name={option.icon} className="h-4 w-4" />}
                      <span className="inline-flex max-w-full items-center gap-x-1.5">
                        <span className="block max-w-[115px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {option.label}
                        </span>
                        {option.chipLabel && (
                          <Chip
                            label={option.chipLabel}
                            variant={option.chipVariant || 'grey'}
                            size="sm"
                            rounded={option.chipRounded || 'rounded-full'}
                            fontWeight="font-medium"
                          />
                        )}
                      </span>
                    </button>
                  )}
                </HUIRadio>
              );
            })}
          </div>
        </div>
      </HUIRadioGroup>
    </div>
  );
});
