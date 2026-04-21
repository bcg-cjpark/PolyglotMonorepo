import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';
import { memo } from 'react';

type AlertVariant = 'success' | 'info' | 'warning' | 'error';

export interface ModalContentProps {
  /** 모달 설명 (접근성용) */
  description?: string;
  /** 알림 타입 */
  alertVariant?: AlertVariant;
  /** 알림 아이콘 표시 여부 */
  showAlertIcon?: boolean;
  /** 컨텐츠 여백 */
  contentPadding?: 'default' | 'compact' | 'none';
  /** children */
  children?: React.ReactNode;
}

const ALERT_ICONS: Record<AlertVariant, IconName> = {
  success: 'check-circle',
  info: 'info',
  warning: 'warning',
  error: 'close',
};

export const ModalContent = memo(function ModalContent({
  description,
  alertVariant,
  showAlertIcon = false,
  contentPadding = 'default',
  children,
}: ModalContentProps) {
  return (
    <main className={`modal-content modal-content--${contentPadding}`}>
      {/* 알림 아이콘 — 색은 SCSS `.alert-icon-container.alert-<v>` 의 `color:` 를 currentColor 상속 */}
      {showAlertIcon && alertVariant && (
        <div className={`alert-icon-container alert-${alertVariant}`}>
          <Icon name={ALERT_ICONS[alertVariant]} size="lg" />
        </div>
      )}

      {/* 설명 */}
      {description && <p className="modal-description">{description}</p>}

      {/* 컨텐츠 */}
      <div className="modal-default-content">{children}</div>
    </main>
  );
});
