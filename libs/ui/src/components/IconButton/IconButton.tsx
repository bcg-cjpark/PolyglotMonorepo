import { Badge } from '#/components/Badge';
import type {
  BadgeAnchorOrigin,
  BadgeColor,
  BadgeOverlap,
  BadgeVariant,
} from '#/components/Badge';
import { Icon } from '#/components/Icon';
import type { ComponentSize, InnerIconProps } from '#/types/components';
import { memo, useMemo } from 'react';

export type LabelPosition = 'left' | 'right' | 'top' | 'bottom';
export type IconButtonShape = 'circle' | 'square';

export interface IconButtonBadgeProps {
  value?: number;
  max?: number;
  variant?: BadgeVariant;
  color?: BadgeColor;
  showZero?: boolean;
  hidden?: boolean;
  overlap?: BadgeOverlap;
  anchorOrigin?: BadgeAnchorOrigin;
  /** 배지 표시 여부 */
  show?: boolean;
}

export interface IconButtonProps {
  /** 아이콘 정보 */
  icon: InnerIconProps;
  /** 라벨 텍스트 */
  label?: string;
  /** 라벨 위치 */
  labelPosition?: LabelPosition;
  /** 버튼 크기 */
  size?: ComponentSize;
  /** 버튼 모양 */
  shape?: IconButtonShape;
  /** 버튼 색상 */
  color?: string;
  /** 배경색 */
  backgroundColor?: string;
  /** 커스텀 패딩 */
  padding?: string;
  /** 배지 설정 */
  badge?: IconButtonBadgeProps;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 커스텀 클래스 */
  className?: string;
  /** 접근성용 라벨 */
  ariaLabel?: string;
  /** 클릭 이벤트 */
  onClick?: (e: React.MouseEvent) => void;
}

function getIconSize(size: ComponentSize) {
  return size === 'sm' ? ('sm' as const) : ('md' as const);
}

function getIconColor(iconProps: InnerIconProps) {
  return iconProps.color ?? 'currentColor';
}

export const IconButton = memo(function IconButton({
  icon,
  label = '',
  labelPosition = 'left',
  size = 'md',
  shape = 'circle',
  color = 'currentColor',
  backgroundColor,
  padding,
  badge,
  disabled = false,
  className,
  ariaLabel,
  onClick,
}: IconButtonProps) {
  const classes = useMemo(() => {
    const c = [
      'inline-flex items-center justify-center',
      'transition-all duration-200',
      'select-none',
      'focus:outline-none',
      'icon-button',
      `icon-button-shape-${shape}`,
      backgroundColor ? 'icon-button-has-bg' : 'icon-button-no-bg',
      `icon-button-size-${size}`,
      disabled ? 'icon-button-disabled' : '',
      padding ? 'icon-button-with-custom-padding' : '',
      label ? 'icon-button-with-label' : '',
      className ?? '',
    ];

    if (label) {
      if (labelPosition === 'top' || labelPosition === 'bottom') {
        c.push('flex-col');
      } else {
        c.push('flex-row');
      }
      c.push(labelPosition === 'top' || labelPosition === 'bottom' ? 'gap-1' : 'gap-1.5');
    }

    return c.filter(Boolean).join(' ');
  }, [shape, backgroundColor, size, disabled, padding, label, labelPosition]);

  const styles = useMemo(() => {
    const s: React.CSSProperties = {};
    if (color && color !== 'currentColor') s.color = color;
    if (backgroundColor) s.backgroundColor = backgroundColor;
    if (padding) s.padding = padding;
    return s;
  }, [color, backgroundColor, padding]);

  const computedAriaLabel = ariaLabel || label || icon.name;

  function handleClick(e: React.MouseEvent) {
    if (disabled) return;
    onClick?.(e);
  }

  const iconElement = (
    <Icon name={icon.name} size={getIconSize(size)} color={getIconColor(icon)} />
  );

  const labelElement = label && (
    <span className={`icon-button-label icon-button-label-${size}`}>{label}</span>
  );

  const hasBadge = badge && badge.show !== false;

  return (
    <button
      type="button"
      className={classes}
      style={styles}
      aria-label={computedAriaLabel}
      aria-disabled={disabled ? true : undefined}
      tabIndex={disabled ? -1 : 0}
      disabled={disabled}
      onClick={handleClick}
    >
      {/* 라벨 top / left */}
      {label && (labelPosition === 'top' || labelPosition === 'left') && labelElement}

      {/* 아이콘 + 배지 */}
      {hasBadge ? (
        <Badge
          value={badge.value ?? 0}
          max={badge.max}
          variant={badge.variant}
          color={badge.color}
          showZero={badge.showZero}
          hidden={badge.hidden}
          overlap={badge.overlap}
          anchorOrigin={badge.anchorOrigin}
        >
          {iconElement}
        </Badge>
      ) : (
        iconElement
      )}

      {/* 라벨 right / bottom */}
      {label && (labelPosition === 'right' || labelPosition === 'bottom') && labelElement}
    </button>
  );
});
