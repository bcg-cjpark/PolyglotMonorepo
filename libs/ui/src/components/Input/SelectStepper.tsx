import { Button } from '#/components/Button';
import { ComboBox } from './ComboBox';
import type { ComboBoxOption } from './ComboBox';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface SelectStepperProps {
  /** 현재 값 */
  value?: number;
  /** 셀렉트 박스 옵션들 */
  options?: ComboBoxOption[];
  /** 증감 단위 배열 */
  steps?: number[];
  /** 크기 */
  size?: 'sm' | 'md';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 레이아웃 방향 */
  layout?: 'horizontal' | 'vertical';
  /** 값 변경 시 */
  onChange?: (value: number | undefined) => void;
  /** 블러 시 */
  onBlur?: () => void;
}

function roundToSafe(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

function formatStepLabel(step: number): string {
  if (!Number.isFinite(step)) return step.toString();
  const rounded = Math.round(step);
  if (Math.abs(step - rounded) < 1e-10) return rounded.toString();
  return step.toFixed(10).replace(/\.?0+$/, '');
}

export const SelectStepper = memo(function SelectStepper({
  value,
  options = [],
  steps = [0.1, 1],
  size = 'sm',
  disabled = false,
  min,
  max,
  placeholder = '선택하세요',
  layout = 'horizontal',
  onChange,
  onBlur,
}: SelectStepperProps) {
  const lastValidRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value != null && Number.isFinite(value)) {
      let v = value;
      if (min !== undefined) v = Math.max(v, min);
      if (max !== undefined) v = Math.min(v, max);
      lastValidRef.current = v;
    }
  }, [value, min, max]);

  const clampValue = useCallback(
    (v: number) => {
      let result = v;
      if (min !== undefined) result = Math.max(result, min);
      if (max !== undefined) result = Math.min(result, max);
      return result;
    },
    [min, max]
  );

  const canDecrease = useCallback(
    (step: number) => {
      if (disabled) return false;
      if (min === undefined) return true;
      return (value ?? 0) - step >= min;
    },
    [disabled, min, value]
  );

  const canIncrease = useCallback(
    (step: number) => {
      if (disabled) return false;
      if (max === undefined) return true;
      return (value ?? 0) + step <= max;
    },
    [disabled, max, value]
  );

  const handleDecrease = useCallback(
    (step: number) => {
      if (disabled) return;
      onChange?.(clampValue(roundToSafe((value ?? 0) - step)));
    },
    [disabled, value, clampValue, onChange]
  );

  const handleIncrease = useCallback(
    (step: number) => {
      if (disabled) return;
      onChange?.(clampValue(roundToSafe((value ?? 0) + step)));
    },
    [disabled, value, clampValue, onChange]
  );

  const handleBlur = useCallback(() => {
    if (value == null && lastValidRef.current != null) {
      onChange?.(lastValidRef.current);
    }
    onBlur?.();
  }, [value, onChange, onBlur]);

  const leftSteps = useMemo(() => [...steps].sort((a, b) => b - a), [steps]);
  const rightSteps = useMemo(() => [...steps].sort((a, b) => a - b), [steps]);

  if (layout === 'vertical') {
    return (
      <div className="flex w-full flex-col gap-1">
        {/* 위쪽 증가 버튼들 */}
        <div className="flex gap-1">
          {leftSteps.map((step, index) => (
            <Button
              key={`top-${index}`}
              label={`+${formatStepLabel(step)}`}
              variant={index === 0 ? 'light' : 'contained-grey'}
              color={index === 0 ? 'red' : 'black'}
              size={size}
              customClass="border-none px-padding-16 flex-1 min-w-[52px]"
              disabled={disabled || !canIncrease(step)}
              onClick={() => handleIncrease(step)}
            />
          ))}
        </div>

        {/* 가운데 ComboBox */}
        <div className="relative w-full" style={{ overflow: 'visible' }}>
          <ComboBox
            value={value}
            options={options}
            size={size}
            disabled={disabled}
            min={min}
            max={max}
            allowFreeInput
            placeholder={placeholder}
            onChange={onChange}
            onBlur={handleBlur}
          />
        </div>

        {/* 아래쪽 감소 버튼들 */}
        <div className="flex gap-1">
          {leftSteps.map((step, index) => (
            <Button
              key={`bottom-${index}`}
              label={`-${formatStepLabel(step)}`}
              variant={index === 0 ? 'light' : 'contained-grey'}
              color={index === 0 ? 'blue' : 'black'}
              size={size}
              customClass="border-none px-padding-16 flex-1 min-w-[60px]"
              disabled={disabled || !canDecrease(step)}
              onClick={() => handleDecrease(step)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-1">
      {/* 왼쪽 감소 버튼들 */}
      {leftSteps.map((step, index) => (
        <Button
          key={`left-${index}`}
          label={`-${formatStepLabel(step)}`}
          variant={index === 0 ? 'light' : 'contained-grey'}
          color={index === 0 ? 'blue' : 'black'}
          size={size}
          customClass="border-none px-padding-16 min-w-[52px]"
          disabled={disabled || !canDecrease(step)}
          onClick={() => handleDecrease(step)}
        />
      ))}

      {/* 가운데 ComboBox */}
      <div className="relative min-w-[112px] flex-1" style={{ overflow: 'visible' }}>
        <ComboBox
          value={value}
          options={options}
          size={size}
          disabled={disabled}
          min={min}
          max={max}
          allowFreeInput
          placeholder={placeholder}
          onChange={onChange}
          onBlur={handleBlur}
        />
      </div>

      {/* 오른쪽 증가 버튼들 */}
      {rightSteps.map((step, index) => (
        <Button
          key={`right-${index}`}
          label={`+${formatStepLabel(step)}`}
          variant={index === rightSteps.length - 1 ? 'light' : 'contained-grey'}
          color={index === rightSteps.length - 1 ? 'red' : 'black'}
          size={size}
          customClass="border-none px-padding-16 min-w-[52px]"
          disabled={disabled || !canIncrease(step)}
          onClick={() => handleIncrease(step)}
        />
      ))}
    </div>
  );
});
