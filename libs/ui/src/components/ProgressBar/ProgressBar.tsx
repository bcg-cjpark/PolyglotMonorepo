import { memo, useMemo } from 'react';

export interface ProgressSegment {
  /** 세그먼트 값 */
  value: number;
  /** 세그먼트 라벨 */
  label?: string;
  /** 세그먼트 색상 클래스 */
  colorClass?: string;
  /** 세그먼트 내부에 라벨 표시 여부 */
  showLabel?: boolean;
}

export interface ProgressBarProps {
  /** 진행률 (0-100) */
  value?: number;
  /** 최대값 */
  max?: number;
  /** 진행바 변형 */
  variant?: 'default' | 'password-strength' | 'performance' | 'stacked';
  /** 라벨 표시 여부 */
  showLabel?: boolean;
  /** 커스텀 라벨 */
  label?: string;
  /** 비밀번호 강도 점수 (0-4) */
  strengthScore?: 0 | 1 | 2 | 3 | 4;
  /** 트랙 색상 클래스 */
  trackColorClass?: string;
  /** 채우기 색상 클래스 */
  fillColorClass?: string;
  /** 스택형 진행바 세그먼트 배열 */
  segments?: ProgressSegment[];
  /** 스택형 진행바 범례 표시 여부 */
  showLegend?: boolean;
}

const STRENGTH_COLORS = [
  'bg-red-red800',
  'bg-red-red500',
  'bg-primary-primary800',
  'bg-green-green500',
  'bg-green-green800',
];

const STRENGTH_LABEL_COLORS = [
  'text-red-red800',
  'text-red-red500',
  'text-primary-primary800',
  'text-green-green500',
  'text-green-green800',
];

const STRENGTH_LABELS = ['매우 약함', '약함', '보통', '강함', '매우 강함'];

const DEFAULT_SEGMENT_COLORS = [
  'bg-blue-blue800-deep',
  'bg-primary-primary800',
  'bg-green-green800',
  'bg-red-red500',
  'bg-red-red800',
  'bg-green-green500',
  'bg-purple-purple800',
  'bg-primary-primary500',
];

function getSegmentBorderRadius(index: number, total: number): string {
  if (total === 1) return '6px';
  if (index === 0) return '6px 0 0 6px';
  if (index === total - 1) return '0 6px 6px 0';
  return '0';
}

export const ProgressBar = memo(function ProgressBar({
  value = 0,
  max = 100,
  variant = 'default',
  showLabel = false,
  label,
  strengthScore = 0,
  trackColorClass = 'bg-bg-bg-surface',
  fillColorClass = 'bg-blue-blue800-deep',
  segments = [],
  showLegend = false,
}: ProgressBarProps) {
  const progressPercentage = useMemo(() => {
    if (variant === 'password-strength') {
      return (strengthScore + 1) * 20;
    }
    return Math.min(Math.max((value / max) * 100, 0), 100);
  }, [variant, strengthScore, value, max]);

  const progressColorClass = useMemo(() => {
    if (variant === 'password-strength') {
      return STRENGTH_COLORS[strengthScore];
    }
    return fillColorClass;
  }, [variant, strengthScore, fillColorClass]);

  const labelColorClass = useMemo(() => {
    if (variant === 'password-strength') {
      return STRENGTH_LABEL_COLORS[strengthScore];
    }
    return 'text-default';
  }, [variant, strengthScore]);

  const displayLabel = useMemo(() => {
    if (label) return label;
    if (variant === 'password-strength') {
      return STRENGTH_LABELS[strengthScore] || STRENGTH_LABELS[0];
    }
    if (variant === 'performance') return undefined;
    return `${Math.round(progressPercentage)}%`;
  }, [label, variant, strengthScore, progressPercentage]);

  const normalizedSegments = useMemo(() => {
    if (variant !== 'stacked' || segments.length === 0) return [];
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return [];
    return segments.map((s, i) => ({
      ...s,
      percentage: (s.value / total) * 100,
      colorClass: s.colorClass || DEFAULT_SEGMENT_COLORS[i % DEFAULT_SEGMENT_COLORS.length],
    }));
  }, [variant, segments]);

  return (
    <div className={`base-progress-bar base-progress-bar--${variant}`}>
      {/* 일반 진행바 */}
      {variant !== 'stacked' && (
        <div className={`base-progress-bar__track ${trackColorClass}`}>
          <div
            className={`base-progress-bar__fill ${progressColorClass}`}
            style={{
              width: `${progressPercentage}%`,
              borderRadius: variant === 'performance' ? '999px 0 0 999px' : '999px',
            }}
          />
        </div>
      )}

      {/* 스택형 진행바 */}
      {variant === 'stacked' && (
        <div
          className={`base-progress-bar__track base-progress-bar__track--stacked ${trackColorClass}`}
        >
          {normalizedSegments.map((segment, index) => (
            <div
              key={index}
              className={`base-progress-bar__segment ${segment.colorClass}`}
              style={{
                width: `${segment.percentage}%`,
                borderRadius: getSegmentBorderRadius(index, normalizedSegments.length),
              }}
            >
              {segment.showLabel && (
                <span className="base-progress-bar__segment-label">
                  {segment.label || `${segment.percentage.toFixed(1)}%`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 라벨 */}
      {showLabel && variant !== 'stacked' && displayLabel && (
        <div
          className={`base-progress-bar__label base-progress-bar__label--${variant} ${labelColorClass}`}
        >
          {displayLabel}
        </div>
      )}

      {/* 스택형 범례 */}
      {variant === 'stacked' && showLegend && (
        <div className="base-progress-bar__legend">
          {normalizedSegments.map((segment, index) => (
            <div key={index} className="base-progress-bar__legend-item">
              <span className={`base-progress-bar__legend-color ${segment.colorClass}`} />
              <span className="base-progress-bar__legend-label">
                {segment.label || `항목 ${index + 1}`}
              </span>
              <span className="base-progress-bar__legend-value">
                {segment.value} ({segment.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
