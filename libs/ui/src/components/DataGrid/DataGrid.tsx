import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  colorSchemeDark,
  EventApiModule,
  HighlightChangesModule,
  LocaleModule,
  ModuleRegistry,
  PaginationModule,
  RenderApiModule,
  RowSelectionModule,
  themeAlpine,
  ValidationModule,
} from 'ag-grid-community';
import type {
  ColDef,
  DomLayoutType,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SortChangedEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { AG_GRID_LOCALE_KR } from '@ag-grid-community/locale';
import { AgGridReact } from 'ag-grid-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Icon } from '#/components/Icon';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CellStyleModule,
  HighlightChangesModule,
  ColumnAutoSizeModule,
  ClientSideRowModelApiModule,
  ColumnApiModule,
  PaginationModule,
  EventApiModule,
  RenderApiModule,
  LocaleModule,
  RowSelectionModule,
]);

/** Vue와 동일: 프로덕션에서만 ValidationModule 생략 (Vite: import.meta.env.DEV) */
if (import.meta.env.DEV) {
  ModuleRegistry.registerModules([ValidationModule]);
}

/**
 * 정렬 상태 (applyColumnState용)
 */
export interface SortState {
  colId: string;
  sort: 'asc' | 'desc';
}

export interface DataGridProps {
  columnDefs: ColDef[];
  rowData: unknown[];
  defaultColDef?: Partial<ColDef>;
  gridOptions?: Partial<GridOptions>;
  height?: string | number;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[];
  suppressPaginationPanel?: boolean;
  resizable?: boolean;
  customColumnWidths?: boolean;
  rowSelection?: 'single' | 'multiple' | 'none';
  disableRowSelection?: boolean;
  visibleColumnCount?: number;
  defaultSortState?: SortState[];
  hideHorizontalScrollbar?: boolean;
  hideVerticalScrollbar?: boolean;
  noRowsToShow?: string;
  components?: Record<string, unknown>;
  showPinnedColumnGradient?: boolean;
  tightLetterSpacing?: boolean;
  /** Vue `useTheme().isDark` 대체 — 기본 false */
  isDark?: boolean;
  onGridReady?: (params: GridReadyEvent) => void;
  onSortChanged?: (event: SortChangedEvent) => void;
  onHeaderButtonLeftClick?: (event: React.MouseEvent) => void;
  onHeaderButtonRightClick?: (event: React.MouseEvent) => void;
}

export interface DataGridHandle {
  api: GridApi | null;
}

function getColumnKey(col: ColDef): string {
  return col.field ?? col.headerName ?? String(col.colId ?? col);
}

const DataGridInner = forwardRef<DataGridHandle, DataGridProps>(function DataGrid(
  {
    columnDefs,
    rowData,
    defaultColDef: defaultColDefProp = {},
    gridOptions: gridOptionsProp = {},
    height = '100%',
    width = '100%',
    sortable = false,
    filterable = false,
    pagination = false,
    paginationPageSize = 100,
    paginationPageSizeSelector = [25, 50, 100, 200],
    suppressPaginationPanel = false,
    resizable = true,
    customColumnWidths = false,
    rowSelection = 'single',
    disableRowSelection = false,
    visibleColumnCount: visibleColumnCountProp,
    defaultSortState,
    hideHorizontalScrollbar = false,
    hideVerticalScrollbar = false,
    noRowsToShow,
    components,
    showPinnedColumnGradient = false,
    tightLetterSpacing = true,
    isDark = false,
    onGridReady: onGridReadyProp,
    onSortChanged: onSortChangedProp,
    onHeaderButtonLeftClick,
    onHeaderButtonRightClick,
  },
  ref
) {
  const gridRef = useRef<AgGridReact<unknown>>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const gridHostRef = useRef<HTMLDivElement | null>(null);
  const windowResizeHandlerRef = useRef<(() => void) | null>(null);
  const previousColumnKeysRef = useRef<string[]>([]);

  const [isReady, setIsReady] = useState(false);
  const [columnStartIndex, setColumnStartIndex] = useState(0);
  const [leftButtonStyle, setLeftButtonStyle] = useState<React.CSSProperties>({});
  const [rightButtonStyle, setRightButtonStyle] = useState<React.CSSProperties>({});
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const gridTheme = useMemo(
    () => (isDark ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDark]
  );

  const localeText = useMemo(
    () => ({
      ...AG_GRID_LOCALE_KR,
      noRowsToShow: noRowsToShow ?? '내용이 없습니다',
    }),
    [noRowsToShow]
  );

  const gridStyle = useMemo(() => {
    const h = typeof height === 'number' ? `${height}px` : height;
    const w = typeof width === 'number' ? `${width}px` : width;
    return { height: h, width: w };
  }, [height, width]);

  const mergedDefaultColDef = useMemo<ColDef>(
    () => ({
      resizable,
      filter: filterable,
      floatingFilter: filterable,
      suppressMenu: !filterable,
      sortable: sortable !== undefined ? sortable : false,
      minWidth: 50,
      maxWidth: undefined,
      flex: customColumnWidths ? undefined : 1,
      autoHeaderHeight: true,
      valueFormatter: (params: ValueFormatterParams) => {
        const value = params.value as unknown;
        if (value === 0 || value === null) return '-';
        return String(value ?? '');
      },
      ...defaultColDefProp,
    }),
    [customColumnWidths, filterable, resizable, sortable, defaultColDefProp]
  );

  const scrollableColumns = useMemo(() => columnDefs.filter((col) => !col.pinned), [columnDefs]);

  const pinnedLeftColumns = useMemo(
    () => columnDefs.filter((col) => col.pinned === 'left'),
    [columnDefs]
  );

  const pinnedRightColumns = useMemo(
    () => columnDefs.filter((col) => col.pinned === 'right'),
    [columnDefs]
  );

  const visibleScrollableColumns = useMemo(() => {
    if (visibleColumnCountProp === undefined) {
      return scrollableColumns;
    }
    return scrollableColumns.slice(columnStartIndex, columnStartIndex + visibleColumnCountProp);
  }, [scrollableColumns, columnStartIndex, visibleColumnCountProp]);

  const canScrollLeft = visibleColumnCountProp !== undefined && columnStartIndex > 0;

  const canScrollRight =
    visibleColumnCountProp !== undefined &&
    columnStartIndex < scrollableColumns.length - visibleColumnCountProp;

  const internalColumnDefs = useMemo(() => {
    const wrapFormatter = (originalFormatter: ColDef['valueFormatter']) => {
      return (params: ValueFormatterParams) => {
        const value = params.value as unknown;
        if (value === 0 || value === null) return '-';
        if (!originalFormatter) return String(value ?? '');
        if (typeof originalFormatter === 'function') {
          const formatted = originalFormatter(params as never);
          return formatted == null ? '' : String(formatted);
        }
        return String(value ?? '');
      };
    };

    const combinedColumns = [
      ...pinnedLeftColumns,
      ...visibleScrollableColumns,
      ...pinnedRightColumns,
    ];

    return combinedColumns.map((col) => {
      const wrappedCol: ColDef = {
        ...col,
        valueFormatter: wrapFormatter(col.valueFormatter),
      };

      const children = (col as ColDef & { children?: ColDef[] }).children;
      if (children && Array.isArray(children)) {
        (wrappedCol as ColDef & { children?: ColDef[] }).children = children.map((childCol) => ({
          ...childCol,
          valueFormatter: wrapFormatter(childCol.valueFormatter),
        }));
      }

      return wrappedCol;
    });
  }, [pinnedLeftColumns, pinnedRightColumns, visibleScrollableColumns]);

  const mergedGridOptions = useMemo<GridOptions>(
    () => ({
      // 페이지네이션 + 정렬 시 행 이동 애니메이션으로 페이지 밖 행이 잠깐 보이는 현상 완화
      animateRows: !pagination,
      enableCellTextSelection: true,
      suppressCellFocus: true,
      suppressContextMenu: true,
      suppressMenuHide: true,
      ...(disableRowSelection
        ? {}
        : {
            rowSelection:
              rowSelection === 'single'
                ? {
                    mode: 'singleRow' as const,
                    checkboxes: false,
                    headerCheckbox: false,
                    enableClickSelection: true,
                  }
                : rowSelection === 'multiple'
                  ? {
                      mode: 'multiRow' as const,
                      checkboxes: false,
                      headerCheckbox: false,
                      enableClickSelection: true,
                    }
                  : undefined,
            suppressRowClickSelection: false,
          }),
      pagination,
      paginationPageSize,
      paginationPageSizeSelector,
      suppressPaginationPanel,
      domLayout: 'normal' as DomLayoutType,
      suppressHorizontalScroll: false,
      suppressScrollOnNewData: false,
      suppressSizeToFit: customColumnWidths,
      localeText,
      suppressColumnVirtualisation: false,
      suppressRowVirtualisation: false,
      enableBrowserTooltips: true,
      suppressAnimationFrame: true,
      suppressBrowserResizeObserver: true,
      suppressLoadingOverlay: false,
      suppressNoRowsOverlay: false,
      suppressColumnMoveAnimation: true,
      suppressMovableColumns: true,
      getRowId: (params) => {
        const data = params.data;
        if (data && typeof data === 'object' && 'id' in data) {
          return String((data as { id: unknown }).id);
        }
        const rowNode = (params as { node?: { rowIndex: number | null } }).node;
        const rowIndex = rowNode?.rowIndex ?? Math.random().toString(36).slice(2, 11);
        return `row-${rowIndex}`;
      },
      ...gridOptionsProp,
    }),
    [
      customColumnWidths,
      disableRowSelection,
      gridOptionsProp,
      localeText,
      pagination,
      paginationPageSize,
      paginationPageSizeSelector,
      rowSelection,
      suppressPaginationPanel,
    ]
  );

  useImperativeHandle(ref, () => ({
    get api() {
      return gridApiRef.current;
    },
  }));

  const updateButtonPositions = useCallback(() => {
    if (!gridApiRef.current || !gridHostRef.current) return;

    queueMicrotask(() => {
      try {
        const gridElement = gridHostRef.current;
        if (!gridElement) return;

        const pinnedLeftHeader = gridElement.querySelector(
          '.ag-pinned-left-header'
        ) as HTMLElement | null;
        const pinnedRightHeader = gridElement.querySelector(
          '.ag-pinned-right-header'
        ) as HTMLElement | null;
        const centerHeader = gridElement.querySelector(
          '.ag-center-cols-header'
        ) as HTMLElement | null;
        const headerContainer = gridElement.querySelector('.ag-header') as HTMLElement | null;

        if (!headerContainer) return;

        const headerRect = headerContainer.getBoundingClientRect();
        const containerRect = gridElement.getBoundingClientRect();
        const headerHeight = headerRect.height;
        const buttonSize = 20;
        const verticalOffset = (headerHeight - buttonSize) / 2;

        const hasPinnedLeft = !!pinnedLeftHeader && pinnedLeftHeader.offsetWidth > 0;
        const hasPinnedRight = !!pinnedRightHeader && pinnedRightHeader.offsetWidth > 0;

        if (visibleColumnCountProp !== undefined && canScrollLeft) {
          if (hasPinnedLeft && pinnedLeftHeader) {
            const pinnedLeftRect = pinnedLeftHeader.getBoundingClientRect();
            const leftPosition = pinnedLeftRect.right - containerRect.left;
            setLeftButtonStyle({
              position: 'absolute',
              left: `${leftPosition}px`,
              top: `${verticalOffset}px`,
              zIndex: 10,
              transform: 'translateX(-50%)',
            });
            setShowLeftButton(true);
          } else if (!hasPinnedLeft) {
            let leftPosition: number;
            if (centerHeader && centerHeader.offsetWidth > 0) {
              const centerRect = centerHeader.getBoundingClientRect();
              leftPosition = centerRect.left - containerRect.left;
            } else {
              const hr = headerContainer.getBoundingClientRect();
              leftPosition = hr.left - containerRect.left;
            }
            setLeftButtonStyle({
              position: 'absolute',
              left: `${leftPosition + 22}px`,
              top: `${verticalOffset}px`,
              zIndex: 10,
              transform: 'translateX(-50%)',
            });
            setShowLeftButton(true);
          } else {
            setShowLeftButton(false);
          }
        } else {
          setShowLeftButton(false);
        }

        if (visibleColumnCountProp !== undefined && canScrollRight) {
          if (hasPinnedRight && pinnedRightHeader) {
            const pinnedRightRect = pinnedRightHeader.getBoundingClientRect();
            const rightPosition = pinnedRightRect.left - containerRect.left;
            setRightButtonStyle({
              position: 'absolute',
              left: `${rightPosition}px`,
              top: `${verticalOffset}px`,
              zIndex: 10,
              transform: 'translateX(-50%)',
            });
            setShowRightButton(true);
          } else {
            let rightPosition: number;
            if (centerHeader && centerHeader.offsetWidth > 0) {
              const centerRect = centerHeader.getBoundingClientRect();
              rightPosition = centerRect.right - containerRect.left;
            } else {
              const hr = headerContainer.getBoundingClientRect();
              rightPosition = hr.right - containerRect.left;
            }
            setRightButtonStyle({
              position: 'absolute',
              left: `${rightPosition}px`,
              top: `${verticalOffset}px`,
              zIndex: 10,
              transform: 'translateX(-50%)',
            });
            setShowRightButton(true);
          }
        } else {
          setShowRightButton(false);
        }
      } catch (e) {
        console.warn('버튼 위치 업데이트 실패:', e);
      }
    });
  }, [visibleColumnCountProp, canScrollLeft, canScrollRight]);

  useEffect(() => {
    const t = window.setTimeout(() => setIsReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    let ro: ResizeObserver | null = null;
    const t = window.setTimeout(() => {
      const el = gridHostRef.current;
      if (!el) return;
      ro = new ResizeObserver(() => {
        updateButtonPositions();
      });
      ro.observe(el);
    }, 0);
    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
    };
  }, [isReady, updateButtonPositions]);

  useEffect(() => {
    const newKeys = columnDefs.map(getColumnKey);
    const oldKeys = previousColumnKeysRef.current;
    const hasStructureChanged =
      newKeys.length !== oldKeys.length || newKeys.some((key, i) => key !== oldKeys[i]);

    if (hasStructureChanged) {
      setColumnStartIndex(0);
    }
    previousColumnKeysRef.current = newKeys;

    if (gridApiRef.current) {
      const t = window.setTimeout(() => updateButtonPositions(), 100);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [columnDefs, updateButtonPositions]);

  useEffect(() => {
    setColumnStartIndex(0);
    if (gridApiRef.current) {
      const t = window.setTimeout(() => updateButtonPositions(), 100);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [visibleColumnCountProp, updateButtonPositions]);

  useEffect(() => {
    if (gridApiRef.current) {
      const t = window.setTimeout(() => updateButtonPositions(), 50);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [columnStartIndex, updateButtonPositions]);

  const handleLeftClick = useCallback(
    (event: React.MouseEvent) => {
      if (visibleColumnCountProp !== undefined) {
        setColumnStartIndex((i) => Math.max(0, i - 1));
      }
      onHeaderButtonLeftClick?.(event);
    },
    [visibleColumnCountProp, onHeaderButtonLeftClick]
  );

  const handleRightClick = useCallback(
    (event: React.MouseEvent) => {
      if (visibleColumnCountProp !== undefined) {
        const total = scrollableColumns.length;
        setColumnStartIndex((i) => Math.min(total - visibleColumnCountProp, i + 1));
      }
      onHeaderButtonRightClick?.(event);
    },
    [visibleColumnCountProp, scrollableColumns.length, onHeaderButtonRightClick]
  );

  const handleGridReady = useCallback(
    (params: GridReadyEvent) => {
      gridApiRef.current = params.api;

      if (!customColumnWidths) {
        window.setTimeout(() => {
          try {
            params.api.sizeColumnsToFit();
          } catch (e) {
            console.warn('sizeColumnsToFit 호출 실패:', e);
          }
        }, 100);
      }

      const handleResize = () => {
        window.setTimeout(() => {
          try {
            if (!customColumnWidths) {
              params.api.sizeColumnsToFit();
            }
            updateButtonPositions();
          } catch (e) {
            console.warn('리사이즈 시 sizeColumnsToFit 호출 실패:', e);
          }
        });
      };

      if (windowResizeHandlerRef.current) {
        window.removeEventListener('resize', windowResizeHandlerRef.current);
      }
      window.addEventListener('resize', handleResize);
      windowResizeHandlerRef.current = handleResize;

      window.setTimeout(() => {
        updateButtonPositions();
      }, 150);

      if (defaultSortState && defaultSortState.length > 0) {
        params.api.applyColumnState({
          state: defaultSortState,
          applyOrder: true,
        });
      }

      onGridReadyProp?.(params);
    },
    [customColumnWidths, defaultSortState, onGridReadyProp, updateButtonPositions]
  );

  useEffect(() => {
    return () => {
      if (windowResizeHandlerRef.current) {
        window.removeEventListener('resize', windowResizeHandlerRef.current);
      }
    };
  }, []);

  const containerClassName = [
    'grid-container',
    hideHorizontalScrollbar ? 'grid-container--hide-horizontal-scrollbar' : '',
    hideVerticalScrollbar ? 'grid-container--hide-vertical-scrollbar' : '',
    showPinnedColumnGradient ? 'grid-container--pinned-column-gradient' : '',
    tightLetterSpacing ? 'grid-container--tight-letter-spacing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isReady ? (
        <div className={containerClassName}>
          <div ref={gridHostRef} style={gridStyle}>
            <AgGridReact<unknown>
              ref={gridRef}
              theme={gridTheme}
              columnDefs={internalColumnDefs}
              rowData={rowData}
              defaultColDef={mergedDefaultColDef}
              gridOptions={mergedGridOptions}
              components={components}
              headerHeight={32}
              onGridReady={handleGridReady}
              onSortChanged={(e) => onSortChangedProp?.(e)}
              onColumnMoved={() => updateButtonPositions()}
              onColumnResized={() => updateButtonPositions()}
            />
          </div>
          {showLeftButton && (
            <button
              type="button"
              className="header-scroll-button header-scroll-button--left"
              style={leftButtonStyle}
              aria-label="이전 컬럼으로 스크롤"
              onClick={handleLeftClick}
            >
              <Icon name="arrow-backward-sm" size="sm" />
            </button>
          )}
          {showRightButton && (
            <button
              type="button"
              className="header-scroll-button header-scroll-button--right"
              style={rightButtonStyle}
              aria-label="다음 컬럼으로 스크롤"
              onClick={handleRightClick}
            >
              <Icon name="arrow-forward-sm" size="sm" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid-placeholder" style={gridStyle} aria-hidden />
      )}
    </>
  );
});

DataGridInner.displayName = 'DataGrid';

export const DataGrid = DataGridInner;
