import { memo } from 'react';

export interface ListProps {
  /** 서브헤더 텍스트 */
  subheader?: string;
  /** 리스트 아이템 간격 */
  gap?: string;
  children?: React.ReactNode;
}

export const List = memo(function List({
  subheader,
  gap = '0px',
  children,
}: ListProps) {
  return (
    <ul className="base-list" style={{ '--list-gap': gap } as React.CSSProperties} role="list">
      {subheader && (
        <div className="base-list__subheader" role="heading" aria-level={3}>
          {subheader}
        </div>
      )}
      <div className="base-list__items">{children}</div>
    </ul>
  );
});
