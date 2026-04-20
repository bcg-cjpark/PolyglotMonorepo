import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AlertVariant = 'light' | 'filled' | 'outlined';
type AlertSeverity = 'success' | 'info' | 'warning' | 'error';
type AlertColor = 'green' | 'blue' | 'yellow' | 'red' | 'primary';
type TextOverflow = 'none' | 'ellipsis' | 'clip' | 'slide';

export interface AlertProps {
  /** 스타일 변형 */
  variant?: AlertVariant;
  /** 심각도 */
  severity?: AlertSeverity;
  /** 색상 계열 */
  color?: AlertColor;
  /** 닫기 가능 여부 */
  closable?: boolean;
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 가운데 정렬 */
  center?: boolean;
  /** 제목 텍스트 */
  title?: string;
  /** 본문 설명 텍스트 */
  description?: string;
  /** 자동 닫힘(ms) */
  autoClose?: number;
  /** 텍스트 오버플로우 처리 */
  textOverflow?: TextOverflow;
  /** 슬라이드 회전 모드 */
  rotate?: boolean;
  /** 제목 커스텀 렌더 */
  renderTitle?: React.ReactNode;
  /** 아이콘 커스텀 렌더 */
  renderIcon?: React.ReactNode;
  /** children (본문) */
  children?: React.ReactNode;
  /** 열림 시 */
  onOpen?: () => void;
  /** 닫힘 시 */
  onClose?: () => void;
}

const SEVERITY_TO_COLOR: Record<AlertSeverity, AlertColor> = {
  success: 'green',
  info: 'blue',
  warning: 'yellow',
  error: 'red',
};

const SEVERITY_ICONS: Record<AlertSeverity, IconName> = {
  success: 'check-circle',
  info: 'info',
  warning: 'warning2',
  error: 'warning',
};

const COLOR_ICONS: Record<AlertColor, IconName> = {
  green: 'check-circle',
  blue: 'info',
  yellow: 'warning2',
  red: 'warning',
  primary: 'info',
};

const COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; solidBg: string; solidText: string }
> = {
  green: {
    bg: 'bg-[var(--trade-correct-background)]',
    text: 'text-[var(--trade-correct-text)]',
    border: 'border-[var(--trade-correct-border)]',
    solidBg: 'bg-[var(--trade-correct-background-solid)]',
    solidText: 'text-[var(--trade-correct-text-solid)]',
  },
  blue: {
    bg: 'bg-[var(--button-blue-background)]',
    text: 'text-[var(--button-blue-text)]',
    border: 'border-[var(--button-blue-border)]',
    solidBg: 'bg-[var(--base-colors-blue-blue800-deep)]',
    solidText: 'text-[var(--font-color-white)]',
  },
  yellow: {
    bg: 'bg-[var(--button-light-solid-background)]',
    text: 'text-[var(--button-light-solid-text)]',
    border: 'border-[var(--button-light-solid-border)]',
    solidBg: 'bg-[var(--base-colors-primary-primary-deep)]',
    solidText: 'text-[var(--font-color-white)]',
  },
  red: {
    bg: 'bg-[var(--button-red-background)]',
    text: 'text-[var(--button-red-text)]',
    border: 'border-[var(--button-red-border)]',
    solidBg: 'bg-[var(--button-red-solid-background)]',
    solidText: 'text-[var(--button-red-solid-text)]',
  },
  primary: {
    bg: 'bg-[var(--background-primary-light)]',
    text: 'text-[var(--font-color-primary)]',
    border: 'border-[var(--background-primary)]',
    solidBg: 'bg-[var(--background-primary)]',
    solidText: 'text-[var(--font-color-black)]',
  },
};

export const Alert = memo(function Alert({
  variant = 'light',
  severity,
  color,
  closable = true,
  showIcon = false,
  center = false,
  title,
  description,
  autoClose = 0,
  textOverflow = 'none',
  rotate = false,
  renderTitle,
  renderIcon,
  children,
  onOpen,
  onClose,
}: AlertProps) {
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<number | null>(null);

  const effectiveColor = useMemo<AlertColor>(() => {
    if (color) return color;
    if (severity) return SEVERITY_TO_COLOR[severity];
    return 'blue';
  }, [color, severity]);

  const iconName = useMemo<IconName>(() => {
    if (severity && SEVERITY_ICONS[severity]) return SEVERITY_ICONS[severity];
    return COLOR_ICONS[effectiveColor];
  }, [severity, effectiveColor]);

  const colors = COLOR_MAP[effectiveColor];

  const containerClasses = useMemo(() => {
    const base = ['relative', 'w-full', 'px-4', 'py-3', 'flex', 'gap-3'];
    const theme =
      variant === 'filled'
        ? [colors.solidBg, colors.solidText, 'border', 'border-transparent']
        : variant === 'outlined'
          ? ['bg-transparent', colors.text, 'border', colors.border, 'rounded-[var(--radius-md)]']
          : [colors.bg, colors.text];
    if (center) base.push('text-center', 'justify-center');
    const hasTitle = !!(title || renderTitle);
    base.push(hasTitle ? 'items-start' : 'items-center');
    return [...base, ...theme].join(' ');
  }, [variant, colors, center, title, renderTitle]);

  const iconColor = variant === 'filled' ? 'var(--font-color-white)' : 'currentColor';

  const textOverflowClasses = useMemo(() => {
    const base = ['text-sm', 'leading-5'];
    if (textOverflow === 'ellipsis') return [...base, 'truncate'].join(' ');
    if (textOverflow === 'clip' || textOverflow === 'slide')
      return [...base, 'overflow-hidden', 'whitespace-nowrap'].join(' ');
    return base.join(' ');
  }, [textOverflow]);

  const slideClass = useMemo(() => {
    if (textOverflow !== 'slide') return '';
    return rotate ? 'base-alert-slide base-alert-slide--rotate' : 'base-alert-slide';
  }, [textOverflow, rotate]);

  const handleClose = useCallback(() => {
    setHidden(true);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    onOpen?.();
    if (autoClose > 0) {
      timerRef.current = window.setTimeout(() => handleClose(), autoClose);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (hidden) return null;

  const hasTitle = !!(title || renderTitle);
  const content = children ?? description;

  return (
    <div className={containerClasses} role="alert">
      {showIcon && (
        <div className="flex items-center">
          {renderIcon ?? (
            <Icon name={iconName} size={hasTitle ? 'md' : 'sm'} color={iconColor} />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {hasTitle && <div className="mb-0.5 font-semibold">{renderTitle ?? title}</div>}
        <div className={textOverflowClasses}>
          {slideClass ? <span className={slideClass}>{content}</span> : content}
        </div>
      </div>

      {closable && (
        <div className="ml-auto pl-2">
          <button
            type="button"
            aria-label="close"
            className="hover:border-current/30 flex h-5 w-5 items-center justify-center rounded border border-transparent"
            onClick={handleClose}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
});
