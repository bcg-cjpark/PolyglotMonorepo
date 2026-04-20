import { getIconSvg } from '#/components/Icon/iconRegistry';
import type { IconName, IconSize } from '#/types/icons';
import { getIconType } from '#/types/icons';
import { memo } from 'react';

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  md: 'icon-md',
  lg: 'icon-lg',
  xl: 'icon-xl',
};

const typeClasses: Record<string, string> = {
  fill: 'icon-fill',
  stroke: 'icon-stroke',
};

export const Icon = memo(function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  className,
}: IconProps) {
  const svgRaw = getIconSvg(name);

  // 크기 클래스에 display·고정 폭이 포함됨 (Icon.scss)
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(sizeClasses[size]);
  } else if (typeof size === 'number') {
    classes.push('base-icon--numeric');
  }

  const iconType = getIconType(name);
  if (iconType) {
    classes.push(typeClasses[iconType]);
  }

  if (className) {
    classes.push(className);
  }

  // 인라인 스타일
  const styles: React.CSSProperties = {};

  if (typeof size === 'number') {
    styles.width = `${size}px`;
    styles.height = `${size}px`;
  }

  if (color && color !== 'currentColor') {
    styles.color = color;
  }

  if (!svgRaw) {
    if (import.meta.env.DEV) {
      console.warn(`Icon "${name}" not found. Please check the icon name.`);
    }
    return (
      <span
        className={classes.join(' ')}
        style={{ ...styles, display: 'inline-block', background: '#e5e7eb', borderRadius: '50%' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={classes.join(' ')}
      style={styles}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svgRaw }}
    />
  );
});
