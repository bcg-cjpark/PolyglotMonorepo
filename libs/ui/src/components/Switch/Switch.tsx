import { memo, useCallback, useMemo } from 'react';

export type SwitchSize = 'sm' | 'md';

export interface SwitchProps {
  /** 토글 상태 */
  checked?: boolean;
  /** 스위치 크기 (sm: 20px, md: 24px) */
  size?: SwitchSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 상태 변경 시 */
  onChange?: (checked: boolean) => void;
}

export const Switch = memo(function Switch({
  checked = false,
  size = 'md',
  disabled = false,
  onChange,
}: SwitchProps) {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onChange?.(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const switchClasses = useMemo(() => {
    const c = [
      'base-switch',
      'relative inline-flex transition-all duration-200',
      'focus:outline-none',
      size === 'sm' ? 'w-[34px] h-[20px]' : 'w-[50px] h-[24px]',
      disabled ? 'base-switch--disabled' : '',
    ];
    return c.filter(Boolean).join(' ');
  }, [size, disabled]);

  const backgroundClasses = [
    'base-switch__background',
    'absolute inset-0 rounded-full transition-all duration-200',
    checked ? 'base-switch__background--on' : 'base-switch__background--off',
  ].join(' ');

  const thumbClasses = useMemo(() => {
    const c = ['base-switch__thumb', 'absolute rounded-full transition-all duration-200'];
    if (size === 'sm') {
      c.push('w-[14px] h-[14px] top-[3px]');
      c.push(checked ? 'translate-x-[17px]' : 'translate-x-[3px]');
    } else {
      c.push('w-[20px] h-[20px] top-[2px]');
      c.push(checked ? 'translate-x-[28px]' : 'translate-x-[2px]');
    }
    return c.join(' ');
  }, [size, checked]);

  return (
    <div
      className={switchClasses}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="sr-only"
        onChange={() => {}}
        tabIndex={-1}
      />
      <div className={backgroundClasses} />
      <div className={thumbClasses} />
      <span className="sr-only">Toggle switch</span>
    </div>
  );
});
