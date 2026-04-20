import { Icon } from '#/components/Icon';
import type { ComponentSize } from '#/types/components';
import { memo, useCallback, useMemo, useRef, useEffect } from 'react';

export interface CheckboxProps {
  /** 체크 여부 */
  checked?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 부분 선택 상태 (3-state) */
  indeterminate?: boolean;
  /** 크기 (sm: 16px, md: 18px, lg: 20px) */
  size?: ComponentSize;
  /** 라벨 (children) */
  children?: React.ReactNode;
  /** 상태 변경 시 */
  onChange?: (checked: boolean) => void;
}

const SIZE_MAP: Record<ComponentSize, string> = {
  sm: 'var(--base-size-size-16)',
  md: 'var(--base-size-size-18)',
  lg: 'var(--base-size-size-20)',
};

export const Checkbox = memo(function Checkbox({
  checked = false,
  disabled = false,
  indeterminate = false,
  size = 'md',
  children,
  onChange,
}: CheckboxProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange?.(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const checkboxStyles = useMemo((): React.CSSProperties => {
    const styles: React.CSSProperties = {
      width: SIZE_MAP[size],
      height: SIZE_MAP[size],
    };

    if (disabled) {
      if (checked) {
        styles.backgroundColor = 'var(--base-colors-neutral-neutral400)';
        styles.borderColor = 'var(--base-colors-neutral-neutral400)';
      } else {
        styles.backgroundColor = 'var(--base-colors-neutral-neutral300)';
        styles.borderColor = 'var(--base-colors-neutral-neutral400)';
      }
    } else {
      if (checked || indeterminate) {
        styles.backgroundColor = 'var(--base-colors-primary-primary800)';
        styles.borderColor = 'var(--base-colors-primary-primary800)';
      } else {
        styles.backgroundColor = 'var(--input-check-radio-active-bg)';
        styles.borderColor = 'var(--base-colors-neutral-neutral400)';
      }
    }

    return styles;
  }, [size, disabled, checked, indeterminate]);

  return (
    <div
      className={`inline-flex min-w-fit flex-shrink-0 cursor-pointer select-none items-center gap-1 align-top leading-none ${disabled ? 'cursor-not-allowed' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
    >
      <div className="flex items-center justify-center">
        <div
          className="box-border flex h-full w-full items-center justify-center rounded-[3px] border border-[1.5px]"
          style={checkboxStyles}
        >
          {checked && !indeterminate && <Icon name="check-sm" color="white" />}
          {indeterminate && <Icon name="minus" color="white" />}
        </div>
      </div>

      <input
        ref={hiddenInputRef}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={() => {}}
        tabIndex={-1}
      />

      {children}
    </div>
  );
});
