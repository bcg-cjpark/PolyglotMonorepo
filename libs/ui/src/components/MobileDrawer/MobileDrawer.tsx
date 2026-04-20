import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MobileDrawerProps {
  /** Drawer 열림 상태 */
  isOpen: boolean;
  /** 오버레이 클릭 시 닫기 여부 */
  closeOnOverlayClick?: boolean;
  /** ESC 키 클릭 시 닫기 여부 */
  closeOnEscape?: boolean;
  /** 드래그로 닫기 가능 여부 */
  draggable?: boolean;
  /** Drawer 너비 */
  width?: string;
  /** portal 대상 요소 */
  container?: HTMLElement | null;
  /** 컨텐츠 */
  children?: React.ReactNode;
  /** 닫기 시 */
  onClose?: () => void;
}

export const MobileDrawer = memo(function MobileDrawer({
  isOpen,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  draggable = true,
  width = '320px',
  container,
  children,
  onClose,
}: MobileDrawerProps) {
  const [translateX, setTranslateX] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // ESC 키 처리
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 터치 이벤트
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!draggable) return;
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
    },
    [draggable]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || !draggable) return;
      e.preventDefault();
      const deltaX = e.touches[0].clientX - startXRef.current;
      setTranslateX(deltaX < 0 ? deltaX : 0);
    },
    [draggable]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (translateX < -100) handleClose();
    setTranslateX(0);
  }, [translateX, handleClose]);

  // 마우스 이벤트 (데스크톱 테스트용)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      isDraggingRef.current = true;
      startXRef.current = e.clientX;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        ev.preventDefault();
        const deltaX = ev.clientX - startXRef.current;
        setTranslateX(deltaX < 0 ? deltaX : 0);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setTranslateX((prev) => {
          if (prev < -100) setTimeout(() => handleClose(), 0);
          return 0;
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [draggable, handleClose]
  );

  if (!isOpen) return null;

  const drawerStyle: React.CSSProperties = {
    width,
    transform: translateX !== 0 ? `translateX(${translateX}px)` : undefined,
    transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out',
  };

  const content = (
    <div className="base-mobile-drawer-wrapper">
      <div
        className="base-mobile-drawer__overlay"
        onClick={closeOnOverlayClick ? handleClose : undefined}
      />
      <div
        className="base-mobile-drawer"
        style={drawerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="base-mobile-drawer__content">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, container ?? document.body);
});
