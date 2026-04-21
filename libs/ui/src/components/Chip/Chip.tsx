import type { ComponentSize } from '#/types/components';
import { memo, useMemo } from 'react';

export type ChipVariant = 'grey' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';

export interface ChipProps {
  /** 칩 텍스트 */
  label?: string;
  /** 칩 스타일 변형 */
  variant?: ChipVariant;
  /** 칩 크기 */
  size?: ComponentSize;
  /** border-radius 클래스 */
  rounded?: string;
  /** 폰트 굵기 */
  fontWeight?: string;
  /** 커스텀 배경색 */
  backgroundColor?: string;
  /** 커스텀 텍스트색 */
  textColor?: string;
  /** 커스텀 테두리색 */
  borderColor?: string;
  /** children */
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const VARIANT_CLASSES: Record<string, string> = {
  grey: 'chip-grey',
  red: 'chip-red',
  green: 'chip-green',
  blue: 'chip-blue',
  yellow: 'chip-yellow',
  purple: 'chip-purple',
};

const FONT_WEIGHT_CLASSES: Record<string, string> = {
  'font-normal': 'font-normal',
  'font-medium': 'font-medium',
  'font-semibold': 'font-semibold',
  'font-bold': 'font-bold',
};

const ROUNDED_CLASSES: Record<string, string> = {
  'rounded-xs': 'rounded-[3px]',
  'rounded-sm': 'rounded-sm',
  'rounded-md': 'rounded-md',
  'rounded-lg': 'rounded-lg',
  'rounded-full': 'rounded-full',
};

// variant 별 기본 텍스트 색상. backgroundColor 가 HEX 로 들어와도 테마마다 HEX
// 값이 달라 문자열 매칭이 깨지므로, variant 를 출처로 삼아 결정.
const CHIP_VARIANT_TEXT_COLORS: Record<ChipVariant, string> = {
  grey: 'var(--font-color-default)',
  red: 'var(--base-colors-red-red800)',
  green: 'var(--base-colors-green-green700)',
  blue: 'var(--trade-short-text)',
  yellow: 'var(--base-colors-primary-primary-deep)',
  purple: 'var(--trade-cancel-text)',
};

function getDefaultTextColor(variant: ChipVariant) {
  return CHIP_VARIANT_TEXT_COLORS[variant] ?? 'var(--font-color-primary)';
}

export const Chip = memo(function Chip({
  label,
  variant = 'grey',
  size = 'md',
  rounded = 'rounded-sm',
  fontWeight = 'font-normal',
  backgroundColor,
  textColor,
  borderColor,
  children,
}: ChipProps) {
  const hasCustomColor = !!(backgroundColor || textColor || borderColor);

  const classes = useMemo(() => {
    const c = [
      'inline-flex items-center justify-center',
      'transition-all duration-150',
      SIZE_CLASSES[size] || 'text-sm px-2.5 py-1',
      FONT_WEIGHT_CLASSES[fontWeight] || 'font-normal',
      ROUNDED_CLASSES[rounded] || 'rounded-sm',
      'base-chip',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
    ];

    if (!hasCustomColor) {
      c.push(VARIANT_CLASSES[variant] || 'chip-grey');
    }

    return c.join(' ');
  }, [size, fontWeight, rounded, hasCustomColor, variant]);

  const customStyles = useMemo(() => {
    const s: React.CSSProperties = {};
    if (backgroundColor) s.backgroundColor = backgroundColor;
    if (textColor) {
      s.color = textColor;
    } else if (backgroundColor) {
      s.color = getDefaultTextColor(variant);
    }
    if (borderColor) {
      s.borderColor = borderColor;
      s.borderWidth = '1px';
      s.borderStyle = 'solid';
    }
    return s;
  }, [backgroundColor, textColor, borderColor, variant]);

  return (
    <span className={classes} style={hasCustomColor ? customStyles : undefined} aria-label={label}>
      {children ?? label}
    </span>
  );
});
