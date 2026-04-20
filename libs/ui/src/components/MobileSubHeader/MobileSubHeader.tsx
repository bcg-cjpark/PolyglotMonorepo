import { IconButton } from '#/components/IconButton';
import type { IconName } from '#/types/icons';
import { memo } from 'react';

export interface MobileSubHeaderProps {
  /** 헤더에 표시할 타이틀 */
  title?: string;
  /** 뒤로가기 아이콘 이름 */
  backIcon?: IconName;
  /** 타이틀 정렬 위치 */
  titleAlign?: 'left' | 'center';
  /** 타이틀 영역 상호작용 허용 여부 */
  allowTitleInteraction?: boolean;
  /** 뒤로가기 버튼 표시 여부 */
  backButtonVisible?: boolean;
  /** 타이틀 커스텀 렌더 */
  renderTitle?: React.ReactNode;
  /** 우측 커스텀 렌더 */
  renderRight?: React.ReactNode;
  /** 뒤로가기 시 */
  onBack?: () => void;
}

export const MobileSubHeader = memo(function MobileSubHeader({
  title = '',
  backIcon = 'arrow-backward',
  titleAlign = 'left',
  allowTitleInteraction = false,
  backButtonVisible = true,
  renderTitle,
  renderRight,
  onBack,
}: MobileSubHeaderProps) {
  const isCenter = titleAlign === 'center';

  return (
    <div
      className={[
        'base-mobile-sub-header',
        isCenter ? 'base-mobile-sub-header--center' : '',
        allowTitleInteraction ? 'base-mobile-sub-header--title-interaction' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 좌측 */}
      <div className="base-mobile-sub-header__left">
        {backButtonVisible && (
          <IconButton
            icon={{ name: backIcon, size: 'md' }}
            shape="square"
            padding="0px"
            size="md"
            onClick={onBack}
          />
        )}
        {!isCenter && (renderTitle ?? <h1 className="base-mobile-sub-header__title">{title}</h1>)}
      </div>

      {/* 중앙 (center 정렬일 때) */}
      {isCenter && (
        <div
          className="base-mobile-sub-header__center"
          style={{ pointerEvents: allowTitleInteraction ? 'auto' : 'none' }}
        >
          {renderTitle ?? (
            <h1 className="base-mobile-sub-header__title base-mobile-sub-header__title--center">
              {title}
            </h1>
          )}
        </div>
      )}

      {/* 우측 */}
      <div className="base-mobile-sub-header__right">
        {renderRight ?? <div className="base-mobile-sub-header__spacer" />}
      </div>
    </div>
  );
});
