import { memo, useMemo } from 'react';

export type ToastDetails = string | Record<string, string | number | undefined | null>;

export interface ToastProps {
  /** 토스트 제목 */
  title?: string;
  /** 토스트 메시지 */
  message: string;
  /** 상세 정보 (문자열 또는 객체) */
  details?: ToastDetails;
  /** 토스트 표시 여부 */
  show?: boolean;
}

export const Toast = memo(function Toast({
  title,
  message,
  details,
  show = false,
}: ToastProps) {
  const formattedDetails = useMemo(() => {
    if (!details) return '';
    if (typeof details === 'string') return details;
    const parts: string[] = [];
    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        parts.push(`${key}: ${value}`);
      }
    });
    return parts.join(' / ');
  }, [details]);

  if (!show) return null;

  return (
    <div className="w-[348px] transition-opacity duration-150" role="alert" aria-live="polite">
      <div className="gap-size-16 py-padding-48 relative flex flex-col items-center justify-center rounded-sm border border-[var(--popup-border)] bg-[var(--popup-background)] px-[48px] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
        {/* 제목 */}
        {title && (
          <h3 className="text-font-16 tracking-3 m-0 text-center font-semibold leading-5 text-[var(--popup-text)]">
            {title}
          </h3>
        )}

        {/* 메시지 */}
        <div className="gap-size-12 flex flex-col items-center">
          <p className="text-font-16 tracking-3 m-0 whitespace-pre-line text-center font-normal leading-5 text-[var(--popup-text)]">
            {message}
          </p>

          {/* 상세 정보 */}
          {formattedDetails && (
            <div className="px-padding-24 py-padding-8 bg-bg-bg-surface w-full rounded-sm">
              <p className="text-font-16 tracking-3 m-0 text-center font-medium leading-5 text-[var(--popup-text)]">
                {formattedDetails}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
