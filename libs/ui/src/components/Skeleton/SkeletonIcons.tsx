import { memo } from 'react';

type IconType = 'image' | 'user';
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const ICON_PATHS: Record<IconType, string> = {
  image:
    'M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z',
  user: 'M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z',
};

const VIEWBOX: Record<IconType, string> = {
  image: '0 0 20 18',
  user: '0 0 20 20',
};

export interface SkeletonIconsProps {
  type: IconType;
  size?: IconSize;
  className?: string;
}

export const SkeletonIcons = memo(function SkeletonIcons({
  type,
  size = 'md',
  className,
}: SkeletonIconsProps) {
  return (
    <svg
      className={`${SIZE_CLASSES[size]} ${className ?? ''}`}
      style={{ color: 'var(--base-colors-neutral-neutral200)' }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox={VIEWBOX[type]}
    >
      <path d={ICON_PATHS[type]} />
    </svg>
  );
});
