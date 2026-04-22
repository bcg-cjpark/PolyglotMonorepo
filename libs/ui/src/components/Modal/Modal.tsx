import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { ModalHeader } from './ModalHeader';
import { ModalContent } from './ModalContent';
import { ModalFooter } from './ModalFooter';
import type { ModalAction } from './ModalFooter';
import type { ComponentSize } from '#/types/components';

export interface ModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 제목 */
  title?: string;
  /** 모달 설명 (접근성용) */
  description?: string;
  /** 모달 크기 */
  size?: ComponentSize | 'xl';
  /** 모달 타입 */
  variant?: 'default' | 'confirm' | 'alert';
  /** 알림 타입 (variant='alert') */
  alertVariant?: 'success' | 'info' | 'warning' | 'error';
  /** 오버레이 클릭 시 닫기 여부 */
  closeOnOverlayClick?: boolean;
  /** ESC 키 클릭 시 닫기 여부 */
  closeOnEscape?: boolean;
  /** 뒤로가기 버튼 표시 여부 */
  showBackButton?: boolean;
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 기본 푸터 표시 여부 */
  showDefaultFooter?: boolean;
  /** 모달 액션 버튼들 */
  actions?: ModalAction[];
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 취소 버튼 표시 여부 */
  showCancelButton?: boolean;
  /** 확인 버튼 표시 여부 */
  showConfirmButton?: boolean;
  /** fullWidth 여부 */
  fullWidth?: boolean;
  /** 컨텐츠 여백 */
  contentPadding?: 'default' | 'compact' | 'none';
  /** 헤더 제목 커스텀 렌더 */
  renderTitle?: React.ReactNode;
  /** 헤더 액션 커스텀 렌더 */
  renderActions?: React.ReactNode;
  /** 푸터 커스텀 렌더 */
  renderFooter?: React.ReactNode;
  /** children (컨텐츠) */
  children?: React.ReactNode;
  /** 닫기 시 */
  onClose?: () => void;
  /** 뒤로가기 시 */
  onBack?: () => void;
  /** 취소 시 */
  onCancel?: () => void;
  /** 확인 시 (Promise 반환 시 resolve 될 때까지 대기 후 닫힘, reject 시 닫히지 않음) */
  onConfirm?: () => void | Promise<void>;
  /** 액션 클릭 시 */
  onAction?: (action: ModalAction, index: number) => void;
}

export const Modal = memo(function Modal({
  isOpen,
  title,
  description,
  size = 'md',
  variant = 'default',
  alertVariant,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showBackButton = false,
  showCloseButton = true,
  showDefaultFooter = true,
  actions = [],
  cancelText = '취소',
  confirmText = '확인',
  showCancelButton = true,
  showConfirmButton = true,
  fullWidth = true,
  contentPadding = 'default',
  renderTitle,
  renderActions,
  renderFooter,
  children,
  onClose,
  onBack,
  onCancel,
  onConfirm,
  onAction,
}: ModalProps) {
  const isEscapePressedRef = useRef(false);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // ESC 키 감지 — Headless UI의 onClose보다 먼저 실행
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isEscapePressedRef.current = true;
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  // Headless UI Dialog의 onClose: ESC와 overlay 클릭 모두 여기로 옴
  const handleDialogClose = useCallback(() => {
    if (isEscapePressedRef.current) {
      isEscapePressedRef.current = false;
      if (closeOnEscape) handleClose();
    } else {
      if (closeOnOverlayClick) handleClose();
    }
  }, [closeOnEscape, closeOnOverlayClick, handleClose]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    handleClose();
  }, [onCancel, handleClose]);

  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm?.();
    } catch {
      // onConfirm 이 throw/reject 하면 모달을 닫지 않아 사용자가 재시도할 수 있도록 함
      return;
    }
    handleClose();
  }, [onConfirm, handleClose]);

  const showHeader = !!title || !!renderTitle || showCloseButton || showBackButton;
  const showFooter = !!renderFooter || actions.length > 0 || showDefaultFooter;

  return (
    <Dialog open={isOpen} onClose={handleDialogClose} className="modal-dialog">
      {/* 오버레이 */}
      <DialogBackdrop className="modal-overlay" />

      {/* 모달 컨테이너 */}
      <div className="modal-container-wrapper">
        <DialogPanel
          className={`modal-container modal-size-${size} modal-variant-${variant}`}
          tabIndex={-1}
        >
          {/* 헤더 */}
          {showHeader && (
            <ModalHeader
              title={title}
              showBackButton={showBackButton}
              showCloseButton={showCloseButton}
              renderTitle={renderTitle}
              renderActions={renderActions}
              onBack={onBack}
              onClose={handleClose}
            />
          )}

          {/* 컨텐츠 */}
          <ModalContent
            description={description}
            alertVariant={alertVariant}
            showAlertIcon={variant === 'alert'}
            contentPadding={contentPadding}
          >
            {children}
          </ModalContent>

          {/* 푸터 */}
          {showFooter && (
            <ModalFooter
              actions={actions}
              showDefaultFooter={showDefaultFooter}
              cancelText={cancelText}
              confirmText={confirmText}
              showCancelButton={showCancelButton}
              showConfirmButton={showConfirmButton}
              fullWidth={fullWidth}
              onCancel={handleCancel}
              onConfirm={handleConfirm}
              onAction={onAction}
            >
              {renderFooter}
            </ModalFooter>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
});
