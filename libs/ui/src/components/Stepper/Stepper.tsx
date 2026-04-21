import { Icon } from '#/components/Icon';
import { Fragment, memo } from 'react';

export interface StepperProps {
  /** dot | label */
  variant: 'dot' | 'label';
  /** 현재 활성 인덱스 (0부터 시작) */
  current?: number;
  /** 스텝퍼 크기 (label variant에서 gap, 연결선 너비에 적용) */
  size?: 'sm' | 'md';
  /** dot variant: 전체 인디케이터 개수 */
  count?: number;
  /** label variant: 스텝 라벨 리스트 */
  stepLabels?: string[];
}

export const Stepper = memo(function Stepper({
  variant,
  current = 0,
  size = 'md',
  count = 3,
  stepLabels = [],
}: StepperProps) {
  if (variant === 'dot') {
    const indicators = Array.from({ length: count }, (_, i) => i);

    return (
      <div className="pagination-join" aria-label={`Step ${current + 1}`}>
        {indicators.map((index) => (
          <div
            key={index}
            className={`pagination-join-indicator ${
              index === current
                ? 'pagination-join-line pagination-join-line-active'
                : 'pagination-join-dot pagination-join-dot-inactive'
            }`}
          />
        ))}
      </div>
    );
  }

  // label variant
  const gapClass = size === 'sm' ? 'gap-3' : 'gap-6';
  const lineWidthClass = size === 'sm' ? 'w-10' : 'w-20';

  return (
    <div
      className={`relative flex items-center justify-center ${gapClass}`}
      aria-label={`Step ${current + 1}`}
    >
      {stepLabels.map((label, index) => (
        <Fragment key={index}>
          <div className="relative flex shrink-0 flex-col items-center justify-start gap-2">
            {/* 스텝 아이콘 */}
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full p-2 ${
                index <= current ? 'bg-primary-primary500' : 'bg-bg-bg-default'
              }`}
            >
              {index <= current ? (
                <Icon name="check-circle" />
              ) : (
                <span className="text-default-muted-dark text-base font-normal">{index + 1}</span>
              )}
            </div>

            {/* 스텝 라벨 */}
            <div
              className={`whitespace-nowrap text-center text-[14px] font-medium leading-[18px] tracking-[-0.35px] ${
                index <= current ? 'text-[var(--chips-status-pending-text)]' : 'text-default-muted'
              }`}
            >
              {label}
            </div>
          </div>

          {/* 연결선 */}
          {index < stepLabels.length - 1 && (
            <div className={`bg-bg-bg-outline h-0.5 shrink-0 ${lineWidthClass}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
});
