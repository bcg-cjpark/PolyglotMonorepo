import { Icon } from '#/components/Icon';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import { memo, useCallback, useMemo, useState } from 'react';

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboBoxProps {
  /** 현재 값 (숫자) */
  value?: number;
  /** 선택 옵션들 */
  options?: ComboBoxOption[];
  /** 크기 */
  size?: 'sm' | 'md';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 자유 입력 허용 여부 */
  allowFreeInput?: boolean;
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 시각적 변형 */
  variant?: 'default' | 'compact';
  /** 값 변경 시 */
  onChange?: (value: number | undefined) => void;
  /** 블러 시 */
  onBlur?: () => void;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return value.toString();
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-10) return rounded.toString();
  return value.toFixed(10).replace(/\.?0+$/, '');
}

export const ComboBox = memo(function ComboBox({
  value,
  options = [],
  size = 'sm',
  disabled = false,
  allowFreeInput = false,
  min,
  max,
  placeholder = '선택하세요',
  variant = 'default',
  onChange,
  onBlur,
}: ComboBoxProps) {
  const [query, setQuery] = useState('');

  const clampValue = useCallback(
    (v: number) => {
      let result = v;
      if (min !== undefined) result = Math.max(result, min);
      if (max !== undefined) result = Math.min(result, max);
      return result;
    },
    [min, max]
  );

  const displayValue = useMemo(() => {
    if (value == null) return '';
    return formatNumber(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!options.length || !query) return options;
    const lower = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(lower) || o.value.toLowerCase().includes(lower)
    );
  }, [options, query]);

  const handleSelect = useCallback(
    (optValue: string | null) => {
      if (!optValue) {
        onChange?.(undefined);
        return;
      }
      const num = parseFloat(optValue);
      if (!Number.isNaN(num)) onChange?.(clampValue(num));
      setQuery('');
    },
    [onChange, clampValue]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      if (!allowFreeInput) return;
      if (v === '') {
        onChange?.(undefined);
        setQuery('');
        return;
      }
      const num = parseFloat(v);
      if (!Number.isNaN(num)) onChange?.(clampValue(num));
    },
    [allowFreeInput, onChange, clampValue]
  );

  const handleBlur = useCallback(() => {
    if (allowFreeInput && value != null) {
      const corrected = clampValue(value);
      if (corrected !== value) onChange?.(corrected);
    }
    setQuery('');
    onBlur?.();
  }, [allowFreeInput, value, clampValue, onChange, onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && allowFreeInput) {
        e.preventDefault();
        setTimeout(() => {
          if (value != null) {
            const corrected = clampValue(value);
            if (corrected !== value) onChange?.(corrected);
          }
          (e.target as HTMLInputElement).blur();
        }, 0);
      }
    },
    [allowFreeInput, value, clampValue, onChange]
  );

  const isCompact = variant === 'compact';

  return (
    <div className="relative w-full" style={{ overflow: 'visible' }}>
      <Combobox value={value?.toString() ?? ''} onChange={handleSelect} disabled={disabled}>
        {({ open }) => (
          <div className="relative w-full">
            <div
              className={[
                'relative flex w-full overflow-hidden rounded-md border border-solid bg-[var(--input-color-surface)] transition-all duration-150',
                disabled
                  ? 'border-input-border-disabled text-input-text-disable cursor-not-allowed !bg-[var(--base-colors-neutral-neutral200)]'
                  : isCompact
                    ? 'border-input-border-static hover:border-input-border-static focus-within:border-input-border-static focus-within:shadow-none'
                    : 'border-input-border-static focus-within:border-input-border-focus hover:border-input-border-focus focus-within:shadow-[0_0_0_1px_var(--input-color-border-focus)]',
                isCompact
                  ? 'h-[24px] rounded-[4px] px-[10px] text-[12px] leading-[14px] focus-within:shadow-none'
                  : size === 'sm'
                    ? 'h-[36px] px-[15px] text-[14px] leading-[16px]'
                    : 'h-[42px] px-[15px] text-[16px] leading-[20px]',
              ].join(' ')}
            >
              <ComboboxInput
                autoComplete="off"
                className={[
                  'w-full border-0 bg-transparent tracking-[-0.35px] outline-none',
                  isCompact
                    ? 'px-0 py-[4px] pr-[16px] text-[12px] leading-[14px]'
                    : size === 'sm'
                      ? 'px-0 py-[13px] pr-[45px] text-[13px] leading-[16px]'
                      : 'px-0 py-[13px] pr-[45px] text-[16px] leading-[20px]',
                  disabled
                    ? 'text-input-text-disable placeholder:text-input-text-disable cursor-not-allowed'
                    : 'text-input-text-static placeholder:text-input-text-placeholder placeholder:font-normal placeholder:tracking-[-0.35px]',
                ].join(' ')}
                displayValue={() => query || displayValue}
                placeholder={placeholder}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />

              <ComboboxButton
                className={[
                  'absolute right-0 top-0 flex h-full items-center',
                  isCompact ? 'pr-[8px]' : 'pr-[15px]',
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                <Icon
                  name="arrow-down"
                  size={isCompact ? 'sm' : size === 'sm' ? 'sm' : 'md'}
                  className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </ComboboxButton>
            </div>

            {filteredOptions.length > 0 && (
              <ComboboxOptions
                className={[
                  'border-input-border-static absolute z-[1350] mt-0 max-h-60 w-full overflow-auto rounded-md border bg-[var(--input-color-surface)] shadow-lg',
                  isCompact ? 'py-0.5' : 'py-1',
                ].join(' ')}
              >
                {filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {({ focus, selected }) => (
                      <li
                        className={[
                          'relative cursor-default select-none tracking-[-0.35px]',
                          isCompact
                            ? 'py-1 pl-2 pr-3 text-[12px] leading-[14px]'
                            : 'py-2 pl-3 pr-9 text-[13px] leading-[16px]',
                          option.disabled
                            ? 'text-input-text-disable cursor-not-allowed opacity-50'
                            : focus
                              ? 'text-input-text-static bg-[var(--background-bg-surface-muted)]'
                              : 'text-input-text-static',
                          selected && !option.disabled ? 'font-medium' : '',
                        ].join(' ')}
                      >
                        <span className="block truncate">{option.label}</span>
                      </li>
                    )}
                  </ComboboxOption>
                ))}
              </ComboboxOptions>
            )}
          </div>
        )}
      </Combobox>
    </div>
  );
});
