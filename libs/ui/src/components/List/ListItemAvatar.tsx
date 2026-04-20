import { Icon } from '#/components/Icon';
import type { InnerIconProps } from '#/types/components';
import { memo, useMemo, useState } from 'react';

export interface ListItemAvatarProps {
  /** 아바타 이미지 URL */
  src?: string;
  /** 이미지 대체 텍스트 */
  alt?: string;
  /** 아바타 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 아바타 스타일 */
  variant?: 'circular' | 'rounded' | 'square';
  /** 직접 표시할 아이콘 */
  icon?: InnerIconProps;
  /** 이미지 로드 실패 시 표시할 텍스트 또는 아이콘 */
  fallback?: string | InnerIconProps;
  /** 아바타 색상 테마 */
  color?: 'default' | 'primary' | 'red' | 'blue' | 'green' | 'purple';
  /** 아바타 투명도 */
  opacity?: number;
  /** 이미지 로드 실패 시 */
  onError?: (e: React.SyntheticEvent) => void;
}

const SIZE_MAP = { sm: 'var(--base-size-size-40)', md: '44px', lg: 'var(--base-size-size-48)' };

export const ListItemAvatar = memo(function ListItemAvatar({
  src,
  alt = '',
  size = 'md',
  variant = 'circular',
  icon,
  fallback,
  color = 'default',
  opacity = 1,
  onError,
}: ListItemAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const classes = useMemo(() => {
    const c = ['list-item-avatar', `list-item-avatar--${size}`, `list-item-avatar--${variant}`];
    if (color !== 'default') c.push(`list-item-avatar--${color}`);
    if (imageError) c.push('list-item-avatar--error');
    return c.join(' ');
  }, [size, variant, color, imageError]);

  const avatarSize = SIZE_MAP[size];

  return (
    <div className={classes} style={{ width: avatarSize, height: avatarSize }}>
      {icon ? (
        <div className="list-item-avatar__icon">
          <Icon
            name={icon.name}
            size={icon.size || 'md'}
            color={icon.color || 'var(--input-icon-default)'}
            className="list-item-avatar__icon-content"
          />
        </div>
      ) : src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className="list-item-avatar__image"
          onError={(e) => {
            setImageError(true);
            onError?.(e);
          }}
          onLoad={() => setImageError(false)}
        />
      ) : (
        <div className="list-item-avatar__fallback">
          {typeof fallback === 'object' ? (
            <Icon
              name={fallback.name}
              size={fallback.size || 'md'}
              className="list-item-avatar__fallback-icon"
            />
          ) : typeof fallback === 'string' ? (
            <span className="list-item-avatar__fallback-text">{fallback}</span>
          ) : (
            <Icon name="person" size="md" className="list-item-avatar__fallback-icon" />
          )}
        </div>
      )}
    </div>
  );
});
