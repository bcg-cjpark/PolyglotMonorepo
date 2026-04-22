import type { CSSProperties, Key, ReactNode } from 'react';

/**
 * Table primitive — 정형 스키마(고정 컬럼) 중·소량 데이터 표시용.
 *
 * 의도적으로 제공하지 않음 (문서 `docs/design-notes/data-display.md` §2 확정):
 *   - 컬럼 정렬 / 필터 / 페이지네이션
 *   - 행 선택 / 체크박스 컬럼 자동 생성
 *   - 가상화
 *
 * 위 요구가 생기면 UI팀 에스컬레이션으로 전용 grid primitive 를 재도입한다.
 *
 * 디자인 결정:
 *   - 제네릭 컴포넌트(`<Row>`) 로 구현. 호출자 row 타입이 그대로 `render` 콜백으로 전달된다.
 *   - React 의 `forwardRef` 는 제네릭 타입 인자가 꼬이므로 사용하지 않는다 (ref 요구 사항도 없음).
 *   - `memo` 도 HOC 래핑 시 제네릭이 깨지므로 사용하지 않는다. 문서 스펙이 memo/forwardRef 를 강제하지 않음.
 *   - semantic `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<th>` / `<td>` 사용. `role` 속성은 조작하지 않는다.
 *   - 테마 스위칭은 루트의 `data-theme` (tokens 자동 스위칭) 에 따라 CSS 변수가 바뀌므로 `isDark` prop 불필요.
 */

export type TableColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn<Row> {
  /** column 식별자 — React key 및 `render` 미지정 시 row 객체 접근 키 로 사용 */
  key: string;
  /** 헤더 셀 내용 */
  header: ReactNode;
  /** 지정되면 셀 내용을 이 콜백 결과로, 없으면 `row[key]` 를 그대로 렌더 */
  render?: (row: Row, rowIndex: number) => ReactNode;
  /** 셀/헤더 수평 정렬. 기본 'left'. */
  align?: TableColumnAlign;
  /** CSS width (예: '120px', '40%'). 지정 없으면 auto. */
  width?: string;
}

export interface TableProps<Row> {
  /** 컬럼 정의 배열 */
  columns: ReadonlyArray<TableColumn<Row>>;
  /** 데이터 행 배열 */
  rows: ReadonlyArray<Row>;
  /** 각 행의 React key 를 계산하는 함수. row 객체의 id 필드 이름이 고정되지 않으므로 호출자가 명시. */
  getRowKey: (row: Row, index: number) => Key;
  /** rows 가 비어있을 때 본문 한 줄로 표시할 문구. 미지정 시 기본 한국어 문구. */
  emptyMessage?: ReactNode;
  /** 루트 `<table>` 요소에 추가할 커스텀 className */
  className?: string;
}

function getCellValue<Row>(row: Row, key: string): ReactNode {
  // row 가 객체인 경우만 key 로 접근. primitive / null 은 빈 문자열.
  if (row !== null && typeof row === 'object') {
    const value = (row as Record<string, unknown>)[key];
    if (value === null || value === undefined) return '';
    // 원시 값(문자/숫자/불리언) 및 ReactNode 는 그대로 렌더 가능.
    return value as ReactNode;
  }
  return '';
}

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  emptyMessage = '데이터가 없습니다',
  className,
}: TableProps<Row>) {
  const rootClassName = ['ui-table', className].filter(Boolean).join(' ');

  return (
    <div className="ui-table__wrapper">
      <table className={rootClassName}>
        <thead className="ui-table__head">
          <tr className="ui-table__row ui-table__row--head">
            {columns.map((col) => {
              const align: TableColumnAlign = col.align ?? 'left';
              const style: CSSProperties | undefined = col.width
                ? { width: col.width }
                : undefined;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`ui-table__cell ui-table__cell--head ui-table__cell--align-${align}`}
                  style={style}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="ui-table__body">
          {rows.length === 0 ? (
            <tr className="ui-table__row ui-table__row--empty">
              <td
                className="ui-table__cell ui-table__cell--empty"
                colSpan={columns.length || 1}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)} className="ui-table__row">
                {columns.map((col) => {
                  const align: TableColumnAlign = col.align ?? 'left';
                  const style: CSSProperties | undefined = col.width
                    ? { width: col.width }
                    : undefined;
                  const content = col.render
                    ? col.render(row, rowIndex)
                    : getCellValue(row, col.key);
                  return (
                    <td
                      key={col.key}
                      className={`ui-table__cell ui-table__cell--body ui-table__cell--align-${align}`}
                      style={style}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
