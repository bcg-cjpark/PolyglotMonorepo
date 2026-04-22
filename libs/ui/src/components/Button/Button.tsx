import { Icon } from '#/components/Icon';
import type { ComponentSize, InnerIconProps } from '#/types/components';
import { memo } from 'react';

export type ButtonColor =
  | 'primary'
  | 'red'
  | 'blue'
  | 'green'
  | 'cancel'
  | 'grey'
  | 'white'
  | 'black';

export type ButtonVariant =
  | 'contained'
  | 'contained-grey'
  | 'outlined'
  | 'outline'
  | 'chip'
  | 'light';

export interface ButtonProps {
  /** 버튼 스타일 */
  variant?: ButtonVariant;
  /** 버튼 컬러 */
  color?: ButtonColor;
  /** 버튼 크기 */
  size?: ComponentSize | 'mini';
  /** pill 스타일 여부 (둥근 모서리) */
  pill?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 좌측 아이콘 */
  leftIcon?: InnerIconProps;
  /** 우측 아이콘 */
  rightIcon?: InnerIconProps;
  /** 중앙 아이콘 (사용 시 label/subLabel 무시) */
  centerIcon?: InnerIconProps;
  /** 버튼 텍스트 */
  label?: string;
  /** 서브 텍스트 */
  subLabel?: string;
  /** 부모 컨테이너 100% 너비로 확장 */
  fullWidth?: boolean;
  /** href 사용 시 <a role="button"> 렌더링 */
  href?: string;
  /** 커스텀 클래스 */
  customClass?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 커스텀 인라인 스타일 */
  style?: React.CSSProperties;
  /** 클릭 이벤트 */
  onClick?: (e: React.MouseEvent) => void;
  /** 네이티브 button type (폼 submit 등). 미지정 시 `button` */
  buttonType?: 'button' | 'submit' | 'reset';
  /** children */
  children?: React.ReactNode;
}

const PREDEFINED_COLORS: readonly ButtonColor[] = [
  'primary',
  'red',
  'blue',
  'green',
  'cancel',
  'grey',
  'white',
  'black',
];

function getIconSize(size: string) {
  switch (size) {
    case 'lg':
    case 'md':
      return 'md' as const;
    case 'sm':
    case 'mini':
      return 'sm' as const;
    default:
      return 'md' as const;
  }
}

function getIconColor(iconProps: InnerIconProps | undefined) {
  return iconProps?.color ?? 'currentColor';
}

export const Button = memo(function Button({
  variant = 'contained',
  color = 'primary',
  size = 'lg',
  pill = false,
  disabled = false,
  leftIcon,
  rightIcon,
  centerIcon,
  label = '',
  subLabel,
  fullWidth = false,
  href,
  customClass,
  isLoading = false,
  style,
  onClick,
  buttonType = 'button',
  children,
}: ButtonProps) {
  const showText = !centerIcon && (label || subLabel);

  const classes = [
    'inline-flex items-center justify-center gap-2.5',
    'transition-all duration-200',
    'select-none',
    'focus:outline-none focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-primary-primary-deep',
    'focus-visible:ring-offset-bg-bg-default',
    fullWidth ? 'w-full' : '',
    `btn-variant-${variant}`,
    `btn-size-${size}`,
    disabled ? 'btn-disabled' : '',
    pill ? 'btn-pill' : '',
    variant !== 'outline' && PREDEFINED_COLORS.includes(color) ? `btn-color-${color}` : '',
    customClass ?? '',
    variant === 'chip' ? '!rounded-[3px] !px-2 !py-0.5 !h-5' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyle: React.CSSProperties = {
    ...(!PREDEFINED_COLORS.includes(color) ? { '--button-custom-color': color } : {}),
    ...style,
  } as React.CSSProperties;

  function handleClick(e: React.MouseEvent) {
    if (disabled || isLoading) return;
    onClick?.(e);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent);
    }
  }

  const content = (
    <>
      {/* 좌측 아이콘 */}
      {leftIcon && !centerIcon && (
        <Icon name={leftIcon.name} size={getIconSize(size)} color={getIconColor(leftIcon)} />
      )}

      {/* 중앙 아이콘 */}
      {centerIcon && (
        <Icon
          name={centerIcon.name}
          size={getIconSize(size)}
          color={getIconColor(centerIcon)}
        />
      )}

      {/* 텍스트 영역 */}
      {showText && (
        <div className="relative flex flex-col items-center justify-center">
          <span
            className={[
              'font-medium',
              subLabel ? 'btn-main-label' : 'btn-label',
              variant === 'chip' ? '!text-xs' : '',
              isLoading ? 'opacity-0' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </span>
          {subLabel && !isLoading && <span className="btn-sub-text font-semibold">{subLabel}</span>}
          {isLoading && (
            <span className="button-spinner-overlay" aria-hidden="true">
              <span className="button-spinner" />
            </span>
          )}
        </div>
      )}

      {/* 우측 아이콘 */}
      {rightIcon && !centerIcon && (
        <Icon name={rightIcon.name} size={getIconSize(size)} color={getIconColor(rightIcon)} />
      )}

      {/* children */}
      {children}
    </>
  );

  const commonProps = {
    className: classes,
    style: inlineStyle,
    'aria-label': centerIcon ? centerIcon.name : label,
    'aria-disabled': disabled || isLoading ? true : undefined,
    tabIndex: disabled || isLoading ? -1 : 0,
    onClick: handleClick,
  };

  if (href) {
    return (
      <a {...commonProps} href={href} role="button" onKeyDown={handleKeyDown}>
        {content}
      </a>
    );
  }

  return (
    <button {...commonProps} type={buttonType} disabled={disabled}>
      {content}
    </button>
  );
});
