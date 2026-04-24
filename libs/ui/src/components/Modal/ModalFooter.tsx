import { Button } from '#/components/Button';
import type { ComponentSize, InnerIconProps } from '#/types/components';
import { memo } from 'react';

export interface ModalAction {
  label: string;
  variant?: 'contained' | 'outlined';
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: InnerIconProps;
  rightIcon?: InnerIconProps;
}

export interface ModalFooterProps {
  /** 모달 액션 버튼들 */
  actions?: ModalAction[];
  /** 기본 푸터 표시 여부 */
  showDefaultFooter?: boolean;
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
  /** 커스텀 푸터 렌더 */
  children?: React.ReactNode;
  /** 취소 시 (Promise 반환 시 Modal 이 resolve 될 때까지 대기, reject/throw 시 닫지 않음) */
  onCancel?: () => void | Promise<void>;
  /** 확인 시 (Promise 반환 시 Modal 이 resolve 될 때까지 대기) */
  onConfirm?: () => void | Promise<void>;
  /** 액션 클릭 시 */
  onAction?: (action: ModalAction, index: number) => void;
}

export const ModalFooter = memo(function ModalFooter({
  actions = [],
  showDefaultFooter = true,
  cancelText = '취소',
  confirmText = '확인',
  showCancelButton = true,
  showConfirmButton = true,
  fullWidth = true,
  children,
  onCancel,
  onConfirm,
  onAction,
}: ModalFooterProps) {
  if (!actions.length && !children && !showDefaultFooter) return null;

  return (
    <footer className="modal-footer">
      {children ?? (
        <>
          {/* 기본 액션 버튼들 */}
          {showDefaultFooter && (
            <div className="modal-footer-actions">
              {showConfirmButton && (
                <Button
                  variant="contained"
                  size="lg"
                  label={confirmText}
                  fullWidth={fullWidth}
                  onClick={onConfirm}
                />
              )}
              {showCancelButton && (
                <Button
                  variant="contained"
                  color="grey"
                  size="lg"
                  label={cancelText}
                  fullWidth={fullWidth}
                  onClick={onCancel}
                />
              )}
            </div>
          )}

          {/* 커스텀 액션 버튼들 */}
          {actions.length > 0 && (
            <div className="modal-custom-actions">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant ?? 'contained'}
                  size={action.size ?? 'lg'}
                  label={action.label}
                  disabled={action.disabled}
                  isLoading={action.loading}
                  leftIcon={action.leftIcon}
                  rightIcon={action.rightIcon}
                  fullWidth={fullWidth}
                  onClick={() => onAction?.(action, index)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </footer>
  );
});
