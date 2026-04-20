import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface BottomSheetProps {
  /** Bottom Sheet 열림 상태 */
  isOpen: boolean;
  /** Bottom Sheet 제목 */
  title?: string;
  /** 오버레이 클릭 시 닫기 여부 */
  closeOnOverlayClick?: boolean;
  /** ESC 키 클릭 시 닫기 여부 */
  closeOnEscape?: boolean;
  /** 드래그로 닫기 가능 여부 */
  draggable?: boolean;
  /** 최대 높이 */
  maxHeight?: string;
  /** 고정 높이 */
  height?: string;
  /** 컨텐츠 */
  children?: React.ReactNode;
  /** 푸터 */
  renderFooter?: React.ReactNode;
  /** portal 대상 요소 (지정하면 해당 요소 안에서 렌더링, 미지정 시 document.body) */
  container?: HTMLElement | null;
  /** 닫기 시 */
  onClose?: () => void;
}

export const BottomSheet = memo(function BottomSheet({
  isOpen,
  title,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  draggable = true,
  maxHeight = '90vh',
  height,
  container,
  children,
  renderFooter,
  onClose,
}: BottomSheetProps) {
  const [translateY, setTranslateY] = useState(0);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);

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
      startYRef.current = e.touches[0].clientY;
    },
    [draggable]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || !draggable) return;
      e.preventDefault();
      const deltaY = e.touches[0].clientY - startYRef.current;
      setTranslateY(deltaY > 0 ? deltaY : 0);
    },
    [draggable]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (translateY > 100) {
      handleClose();
    }
    setTranslateY(0);
  }, [translateY, handleClose]);

  // 마우스 이벤트 (데스크톱 테스트용)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      isDraggingRef.current = true;
      startYRef.current = e.clientY;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        ev.preventDefault();
        const deltaY = ev.clientY - startYRef.current;
        setTranslateY(deltaY > 0 ? deltaY : 0);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setTranslateY((prev) => {
          if (prev > 100) {
            // 다음 틱에서 close 호출
            setTimeout(() => handleClose(), 0);
          }
          return 0;
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [draggable, handleClose]
  );

  if (!isOpen) return null;

  const sheetStyle: React.CSSProperties = {
    maxHeight,
    height: height || undefined,
    transform: `translateY(${translateY}px)`,
    transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out',
  };

  return createPortal(
    <div className="base-bottom-sheet-wrapper">
      {/* 오버레이 */}
      <div
        className="base-bottom-sheet__overlay"
        onClick={closeOnOverlayClick ? handleClose : undefined}
      />

      {/* Bottom Sheet */}
      <div className="base-bottom-sheet" style={sheetStyle}>
        {/* 드래그 핸들 */}
        {draggable && (
          <div
            className="base-bottom-sheet__handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* 헤더 */}
        {title && (
          <div className="base-bottom-sheet__header">
            <h2 className="base-bottom-sheet__title">{title}</h2>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className={`base-bottom-sheet__content px-6 ${!title ? 'pt-6' : ''}`}>{children}</div>

        {/* 푸터 */}
        {renderFooter && <div className="base-bottom-sheet__footer">{renderFooter}</div>}
      </div>
    </div>,
    container ?? document.body
  );
});
