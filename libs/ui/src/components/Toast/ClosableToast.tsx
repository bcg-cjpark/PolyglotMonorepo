import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { memo, useCallback } from 'react';

export type ToastVariant = 'info' | 'info-purple' | 'info-blue' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  timestamp: number;
  variant?: ToastVariant;
  icon?: IconName;
}

export interface ClosableToastProps {
  /** 표시할 토스트 목록 */
  toasts?: ToastItem[];
  /** 토스트 너비 */
  width?: string;
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 토스트 제거 시 */
  onRemove?: (id: string) => void;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'toast-info',
  'info-purple': 'toast-info-purple',
  'info-blue': 'toast-info-blue',
  warning: 'toast-warning',
  error: 'toast-error',
};

export const ClosableToast = memo(function ClosableToast({
  toasts = [],
  width = '400px',
  showCloseButton = true,
  onRemove,
}: ClosableToastProps) {
  const handleRemove = useCallback(
    (id: string) => {
      onRemove?.(id);
    },
    [onRemove]
  );

  return (
    <div className="flex flex-col items-end gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto relative flex items-center justify-between gap-1 rounded-sm p-2 ${VARIANT_CLASSES[toast.variant || 'info']}`}
          style={{ width }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            <div className="flex shrink-0 items-center gap-2">
              {toast.icon && <Icon name={toast.icon} size={16} />}
              {toast.title && (
                <h3 className="text-font-13 m-0 font-semibold leading-[1.4] tracking-[-0.35px]">
                  {toast.title}
                </h3>
              )}
            </div>
            <p
              className="text-font-13 m-0 min-w-0 flex-1 truncate font-normal leading-[1.4] tracking-[-0.35px]"
              title={toast.message}
            >
              {toast.message}
            </p>
          </div>
          {showCloseButton && (
            <button
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 opacity-70 transition-opacity duration-200 hover:opacity-100"
              onClick={() => handleRemove(toast.id)}
              aria-label="닫기"
            >
              <Icon name="icn-delete" color="var(--input-icon-off)" size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
});
