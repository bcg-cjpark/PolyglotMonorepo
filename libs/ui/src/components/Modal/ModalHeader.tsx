import { IconButton } from '#/components/IconButton';
import { memo } from 'react';

export interface ModalHeaderProps {
  /** 모달 제목 */
  title?: string;
  /** 뒤로가기 버튼 표시 여부 */
  showBackButton?: boolean;
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 제목 영역 커스텀 렌더 */
  renderTitle?: React.ReactNode;
  /** 액션 영역 커스텀 렌더 */
  renderActions?: React.ReactNode;
  /** 뒤로가기 시 */
  onBack?: () => void;
  /** 닫기 시 */
  onClose?: () => void;
}

export const ModalHeader = memo(function ModalHeader({
  title,
  showBackButton = false,
  showCloseButton = true,
  renderTitle,
  renderActions,
  onBack,
  onClose,
}: ModalHeaderProps) {
  return (
    <header className="modal-header">
      {/* 왼쪽: 뒤로가기 */}
      {showBackButton && (
        <div className="modal-header-left">
          <IconButton
            className="modal-back-button"
            icon={{ name: 'arrow-backward', size: 'md' }}
            shape="square"
            padding="0px"
            size="md"
            onClick={onBack}
          />
        </div>
      )}

      {/* 중앙: 제목 */}
      <div className="modal-header-center">
        {renderTitle ?? (title && <h2 className="modal-title">{title}</h2>)}
      </div>

      {/* 오른쪽: 액션 */}
      <div className="modal-header-right">
        {renderActions ??
          (showCloseButton && (
            <IconButton
              className="modal-close-button"
              icon={{ name: 'close', size: 'md' }}
              shape="square"
              padding="0px"
              size="md"
              onClick={onClose}
            />
          ))}
      </div>
    </header>
  );
});
