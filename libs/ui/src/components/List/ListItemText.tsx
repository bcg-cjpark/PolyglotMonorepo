import { memo, useMemo } from 'react';

export interface ListItemTextProps {
  /** 주요 텍스트 */
  primary: string;
  /** 보조 텍스트 */
  secondary?: string;
  /** 오른쪽 주요 텍스트 */
  rightPrimary?: string;
  /** 오른쪽 보조 텍스트 */
  rightSecondary?: string;
  /** 들여쓰기 여부 */
  inset?: boolean;
  /** 여러 줄 텍스트 지원 */
  multiline?: boolean;
  /** 텍스트 줄바꿈 방지 */
  noWrap?: boolean;
  /** 왼쪽 커스텀 렌더 */
  renderLeft?: React.ReactNode;
  /** 오른쪽 커스텀 렌더 */
  renderRight?: React.ReactNode;
}

export const ListItemText = memo(function ListItemText({
  primary,
  secondary,
  rightPrimary,
  rightSecondary,
  inset = false,
  multiline = false,
  noWrap = false,
  renderLeft,
  renderRight,
}: ListItemTextProps) {
  const textClasses = useMemo(() => {
    const c = ['list-item-text'];
    if (inset) c.push('list-item-text--inset');
    if (multiline) c.push('list-item-text--multiline');
    if (noWrap) c.push('list-item-text--no-wrap');
    if (rightPrimary || rightSecondary) c.push('list-item-text--with-right');
    return c.join(' ');
  }, [inset, multiline, noWrap, rightPrimary, rightSecondary]);

  const mod = (base: string) => {
    const c = [base];
    if (multiline) c.push(`${base}--multiline`);
    if (noWrap) c.push(`${base}--no-wrap`);
    return c.join(' ');
  };

  return (
    <div className={textClasses}>
      <div className="list-item-text__left">
        {renderLeft ?? (
          <>
            <div className={mod('list-item-text__primary')}>{primary}</div>
            {secondary && <div className={mod('list-item-text__secondary')}>{secondary}</div>}
          </>
        )}
      </div>
      <div className="list-item-text__right">
        {renderRight}
        {rightPrimary && <div className={mod('list-item-text__right-primary')}>{rightPrimary}</div>}
        {rightSecondary && (
          <div className={mod('list-item-text__right-secondary')}>{rightSecondary}</div>
        )}
      </div>
    </div>
  );
});
