import { Icon } from '#/components/Icon';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from '@headlessui/react';
import { memo, useMemo, Fragment } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  subtext?: string;
  disabled?: boolean;
}

export interface InputSelectProps {
  /** 선택된 값 */
  value?: string;
  /** 스타일 변형 */
  variant?: 'default' | 'compact' | 'compact-bold' | 'chart-window' | 'header';
  /** 색상 */
  color?: 'black' | 'gray' | 'white';
  /** 플레이스홀더 */
  placeholder?: string;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 선택 옵션들 */
  options?: SelectOption[];
  /** 좌우 패딩 제거 */
  noPaddingX?: boolean;
  /** 텍스트 정렬 */
  textAlign?: 'left' | 'center' | 'right';
  /** 너비 설정 */
  width?: 'full' | 'auto' | 'fit';
  /** 값 변경 시 */
  onChange?: (value: string) => void;
  /** 포커스 시 */
  onFocus?: (e: React.FocusEvent) => void;
  /** 블러 시 */
  onBlur?: (e: React.FocusEvent) => void;
  /** 옵션 커스텀 렌더 */
  renderOption?: (
    option: SelectOption,
    state: { active: boolean; selected: boolean }
  ) => React.ReactNode;
}

export const InputSelect = memo(function InputSelect({
  value,
  variant = 'default',
  color = 'white',
  placeholder = '선택하세요',
  size = 'sm',
  disabled = false,
  error = false,
  errorMessage = '',
  options = [],
  noPaddingX = false,
  textAlign = 'left',
  width = 'full',
  onChange,
  onFocus,
  onBlur,
  renderOption,
}: InputSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const justifyClass =
    textAlign === 'center'
      ? 'justify-center'
      : textAlign === 'right'
        ? 'justify-end'
        : 'justify-between';

  const isCompact = variant === 'compact' || variant === 'compact-bold' || variant === 'header';

  const buttonClasses = useMemo(() => {
    const base = isCompact
      ? `relative w-full min-w-0 transition-all duration-150 flex items-center ${justifyClass} tracking-[-0.35px]`
      : `relative w-full min-w-0 rounded-md transition-all duration-150 border border-solid flex items-center ${justifyClass} tracking-[-0.35px]`;

    const px = noPaddingX ? 'px-0' : '';

    const sizeClass =
      variant === 'header'
        ? `${px || 'px-0'} h-auto text-[16px] font-semibold leading-[18px]`
        : variant === 'compact-bold'
          ? `${px || 'px-[15px]'} h-[24px] text-[14px] font-semibold leading-[16px]`
          : variant === 'compact'
            ? `${px || 'px-[15px]'} h-[24px] text-[10px] font-medium leading-[16px]`
            : variant === 'chart-window'
              ? `${px || 'px-[10px]'} h-[24px] text-[13px] leading-[16px] font-semibold`
              : size === 'sm'
                ? `${px || 'px-[15px]'} h-[42px] text-[14px] leading-[16px]`
                : `${px || 'px-[15px]'} h-[48px] text-[16px] leading-[20px]`;

    const colorClass =
      variant === 'header'
        ? 'bg-transparent'
        : color === 'black'
          ? 'bg-[var(--input-color-surface-dark)] !text-neutral-neutral050 !border-[var(--input-color-border-dark)]'
          : color === 'gray'
            ? 'bg-[var(--chart-chart-bg-on)]'
            : 'bg-[var(--input-color-surface)]';

    const stateClass = disabled
      ? 'cursor-not-allowed'
      : variant === 'header'
        ? ''
        : 'border-input-border-static';

    const textColor = selectedOption ? 'text-input-text-static' : 'text-input-text-placeholder';

    return `${base} ${sizeClass} ${stateClass} ${textColor} ${colorClass}`;
  }, [variant, color, size, disabled, noPaddingX, justifyClass, selectedOption, isCompact]);

  const textAlignClass =
    textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left';
  const containerWidthClass = width === 'auto' ? 'w-auto' : width === 'fit' ? 'w-fit' : 'w-full';

  const disabledStyle: React.CSSProperties | undefined = disabled
    ? variant === 'default'
      ? {
          backgroundColor: 'var(--input-color-bg-disabled)',
          borderColor: 'var(--input-color-border-disabled)',
          color: 'var(--input-color-text-disable)',
          opacity: 1,
        }
      : { color: 'var(--input-color-text-disable)', opacity: 1 }
    : undefined;

  const iconName =
    variant === 'default' || variant === 'header'
      ? ('arrow-down' as const)
      : ('arrow-down-solid' as const);
  const iconSize =
    variant === 'default'
      ? size === 'sm'
        ? ('sm' as const)
        : ('md' as const)
      : variant === 'header'
        ? ('md' as const)
        : ('md' as const);

  return (
    <div className={containerWidthClass}>
      <Listbox value={value} onChange={(v) => onChange?.(v as string)} disabled={disabled}>
        {({ open }) => (
          <div className={`relative ${containerWidthClass}`}>
            <ListboxButton
              className={buttonClasses}
              style={disabledStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <span className={`truncate ${textAlignClass}`}>
                {selectedOption?.label || placeholder}
              </span>
              <Icon
                name={iconName}
                size={iconSize}
                className={`ml-2 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </ListboxButton>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions
                className={[
                  isCompact
                    ? 'z-50 max-h-60 overflow-auto bg-[--chart-chart-bg-on] py-1 shadow-lg'
                    : 'border-input-border-static z-50 max-h-60 overflow-auto rounded-md border py-1 shadow-lg',
                  color === 'black'
                    ? '!border-[var(--input-color-border-dark)] bg-[var(--input-color-surface-dark)]'
                    : color === 'gray'
                      ? 'bg-[var(--chart-chart-bg-on)]'
                      : 'bg-[var(--input-color-surface)]',
                  'absolute mt-1 w-full',
                ].join(' ')}
              >
                {options.map((option) => (
                  <ListboxOption key={option.value} value={option.value} disabled={option.disabled}>
                    {({ focus, selected }) => (
                      <li
                        className={[
                          variant === 'compact-bold'
                            ? 'relative cursor-default select-none py-2 pl-3 pr-3 text-[14px] font-semibold leading-[16px] tracking-[-0.35px]'
                            : variant === 'compact'
                              ? 'relative cursor-default select-none py-2 pl-3 pr-3 text-[10px] font-medium leading-[16px] tracking-[-0.35px]'
                              : 'relative cursor-default select-none py-2 pl-3 pr-3 text-[13px] leading-[16px] tracking-[-0.35px]',
                          color === 'black' ? '!text-neutral-neutral050' : '',
                          option.disabled
                            ? 'text-input-text-disable cursor-not-allowed opacity-50'
                            : focus
                              ? color === 'black'
                                ? 'text-input-text-static bg-neutral-neutral800'
                                : 'text-input-text-static bg-[var(--background-bg-surface-muted)]'
                              : 'text-input-text-static',
                          selected && !option.disabled ? 'font-medium' : '',
                        ].join(' ')}
                      >
                        {renderOption ? (
                          renderOption(option, { active: focus, selected })
                        ) : (
                          <span className="flex w-full min-w-0 items-center justify-between gap-2">
                            <span className="truncate">{option.label}</span>
                            {option.subtext && (
                              <span
                                className={`shrink-0 ${option.disabled ? 'text-input-text-disable' : 'text-default-muted'}`}
                              >
                                {option.subtext}
                              </span>
                            )}
                          </span>
                        )}
                      </li>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  );
});
