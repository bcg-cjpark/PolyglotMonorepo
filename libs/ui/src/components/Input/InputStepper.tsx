import { Icon } from '#/components/Icon';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

export interface InputStepperProps {
  /** 현재 값 */
  value?: number;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 증감 단위 */
  step?: number;
  /** 표시 형식 */
  variant?: 'default' | 'unit' | 'range';
  /** 단위 텍스트 (variant='unit') */
  unitLabel?: string;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 값 변경 시 */
  onChange?: (value: number) => void;
  /** 포커스 시 */
  onFocus?: (e: React.FocusEvent) => void;
  /** 블러 시 */
  onBlur?: (e: React.FocusEvent) => void;
}

function roundToSafe(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-10) return rounded.toString();
  return value.toFixed(10).replace(/\.?0+$/, '');
}

export const InputStepper = memo(function InputStepper({
  value: propValue,
  placeholder = '',
  size = 'sm',
  disabled = false,
  min,
  max,
  step = 0.00001,
  variant = 'default',
  unitLabel = 'Lot',
  error = false,
  errorMessage = '',
  onChange,
  onFocus,
  onBlur,
}: InputStepperProps) {
  const [localValue, setLocalValue] = useState(propValue ?? 0);
  // IME 조합 중엔 숫자 필터/파싱을 건너뛰고 raw 만 DOM 에 유지.
  // 조합이 끝난 (compositionend) 시점에 한 번만 처리해서 한글 조합 문자가
  // 중간에 잘리는 문제를 방지 (Input.tsx 와 동일 패턴).
  const isComposingRef = useRef(false);
  const [rawText, setRawText] = useState<string | null>(null);

  useEffect(() => {
    if (propValue !== undefined && Number.isFinite(propValue)) {
      setLocalValue(propValue);
    }
  }, [propValue]);

  const clampToRange = useCallback(
    (v: number) => {
      let result = v;
      if (min !== undefined) result = Math.max(result, min);
      if (max !== undefined) result = Math.min(result, max);
      return result;
    },
    [min, max]
  );

  const canDecrease = !disabled && (min === undefined || localValue - step >= min);
  const canIncrease = !disabled && (max === undefined || localValue + step <= max);

  const iconSize = size === 'sm' ? ('sm' as const) : ('md' as const);
  const borderClass = error ? 'border-input-border-error' : 'border-input-border-static';

  const applyNumericFilter = useCallback(
    (raw: string) => {
      let cleanValue = raw.replace(/[^0-9.-]/g, '');
      if (cleanValue.indexOf('-') > 0) cleanValue = cleanValue.replace(/-/g, '');
      const dots = (cleanValue.match(/\./g) || []).length;
      if (dots > 1) {
        const idx = cleanValue.indexOf('.');
        cleanValue =
          cleanValue.substring(0, idx + 1) + cleanValue.substring(idx + 1).replace(/\./g, '');
      }
      if (cleanValue === '' || cleanValue === '-') {
        setLocalValue(0);
        setRawText(null);
        return;
      }
      const num = parseFloat(cleanValue);
      if (!Number.isFinite(num)) return;
      const clamped = clampToRange(num);
      setLocalValue(clamped);
      setRawText(null);
      onChange?.(clamped);
    },
    [clampToRange, onChange]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      // IME 조합 중: DOM/state 싱크 유지만 하고 숫자 필터/부모 onChange 는
      // compositionend 에서 확정 (한글 조합 중간에 필터가 작동해서 잘리는 것 방지).
      if (isComposingRef.current) {
        setRawText(input.value);
        return;
      }
      applyNumericFilter(input.value);
    },
    [applyNumericFilter]
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const raw = (e.target as HTMLInputElement).value;
      applyNumericFilter(raw);
    },
    [applyNumericFilter]
  );

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDecrease) return;
      const v = clampToRange(roundToSafe(localValue - step));
      setLocalValue(v);
      onChange?.(v);
    },
    [canDecrease, clampToRange, localValue, step, onChange]
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canIncrease) return;
      const v = clampToRange(roundToSafe(localValue + step));
      setLocalValue(v);
      onChange?.(v);
    },
    [canIncrease, clampToRange, localValue, step, onChange]
  );

  const correctValue = useCallback(() => {
    const clamped = clampToRange(localValue);
    if (clamped !== localValue) {
      setLocalValue(clamped);
      onChange?.(clamped);
    }
  }, [clampToRange, localValue, onChange]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      correctValue();
      onBlur?.(e);
    },
    [correctValue, onBlur]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      const currentValue = (e.target as HTMLInputElement).value;
      const allowed = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ];
      if (key === 'Enter') {
        e.preventDefault();
        setTimeout(() => {
          correctValue();
          (e.target as HTMLInputElement).blur();
        }, 0);
        return;
      }
      if (allowed.includes(key)) return;
      if (/^[0-9]$/.test(key)) return;
      if (key === '.' && !currentValue.includes('.')) return;
      if (
        key === '-' &&
        !currentValue.includes('-') &&
        (e.target as HTMLInputElement).selectionStart === 0
      )
        return;
      e.preventDefault();
    },
    [correctValue]
  );

  // 조합 중이면 raw (필터 전 한글 조각 포함) 을 그대로 보여주고,
  // 조합이 끝나거나 IME 사용이 아닌 입력이면 포매팅된 숫자를 보여준다.
  const inputValue = rawText ?? formatNumber(localValue);

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-[34px] w-full items-center">
        {/* Range prefix */}
        {variant === 'range' && (
          <div
            className={`bg-input-color-surface flex select-none items-center justify-center rounded-l-[6px] border border-r-0 py-2 pl-3 text-[14px] font-normal leading-[18px] ${borderClass} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            ~
          </div>
        )}

        {/* 숫자 입력 */}
        <input
          type="text"
          inputMode="decimal"
          className={[
            'bg-input-color-surface min-w-0 flex-1 border px-3 py-2 text-[14px] font-normal leading-[18px] focus:outline-none focus:ring-0',
            borderClass,
            disabled ? 'cursor-not-allowed opacity-50' : '',
            variant === 'default' || variant === 'unit' ? 'rounded-l-[6px] border-r-0' : '',
            variant === 'range' || variant === 'unit' ? 'border-r-0' : '',
            variant === 'range' ? 'border-l-0' : '',
            !error ? 'focus:border-input-border-static' : 'focus:border-input-border-error',
          ]
            .filter(Boolean)
            .join(' ')}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={onFocus}
          onBlur={handleBlur}
        />

        {/* Unit suffix */}
        {variant === 'unit' && (
          <div
            className={`bg-input-color-surface flex select-none items-center justify-center border border-l-0 border-r-0 px-3 py-2 text-[14px] font-normal leading-[18px] ${borderClass}`}
          >
            {unitLabel}
          </div>
        )}

        {/* 증가 버튼 */}
        <div
          className={`bg-input-color-surface flex cursor-pointer items-center justify-center border px-1 py-[9px] transition-colors hover:bg-gray-50 ${borderClass} ${!canIncrease ? 'cursor-not-allowed opacity-50' : ''}`}
          onMouseDown={handleIncrease}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Icon name="plus" size={iconSize} />
        </div>

        {/* 감소 버튼 */}
        <div
          className={`bg-input-color-surface flex cursor-pointer items-center justify-center rounded-r-[6px] border border-l-0 px-1 py-[9px] transition-colors hover:bg-gray-50 ${borderClass} ${!canDecrease ? 'cursor-not-allowed opacity-50' : ''}`}
          onMouseDown={handleDecrease}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Icon name="minus" size={iconSize} />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && errorMessage && (
        <div className="text-input-text-error mt-1 text-[12px] font-medium">{errorMessage}</div>
      )}
    </div>
  );
});
