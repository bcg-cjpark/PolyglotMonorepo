import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColDef } from 'ag-grid-community';
import { DataGrid } from './DataGrid';

/**
 * `DataGrid` 는 AG Grid 기반 테이블 래퍼입니다. `columnDefs` / `rowData` 로
 * 컬럼과 행을 지정하고, `sortable` / `filterable` / `pagination` /
 * `rowSelection` 등으로 동작을 토글합니다.
 *
 * 복합 객체 prop 이 많아 controls 는 대부분 비활성화하고 각 스토리의 args 로
 * 프리셋을 제공합니다.
 */
interface SampleRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  score: number;
}

const BASIC_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: '이름', width: 140 },
  { field: 'email', headerName: '이메일', width: 220 },
  { field: 'role', headerName: '역할', width: 120 },
  { field: 'status', headerName: '상태', width: 100 },
];

const FULL_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: '이름', width: 140 },
  { field: 'email', headerName: '이메일', width: 220 },
  { field: 'role', headerName: '역할', width: 120 },
  { field: 'status', headerName: '상태', width: 100 },
  { field: 'joinedAt', headerName: '가입일', width: 140 },
  { field: 'score', headerName: '점수', width: 100, type: 'numericColumn' },
];

function generateRows(count: number): SampleRow[] {
  const roles = ['관리자', '편집자', '뷰어', '게스트'];
  const statuses = ['활성', '휴면', '정지'];
  const firstNames = ['민수', '서연', '지호', '예은', '도윤', '하은', '시우', '수아'];
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤'];

  return Array.from({ length: count }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last = surnames[i % surnames.length];
    return {
      id: i + 1,
      name: `${last}${first}`,
      email: `user${i + 1}@example.com`,
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
      joinedAt: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      score: Math.round(Math.random() * 100),
    };
  });
}

const TEN_ROWS = generateRows(10);
const FIFTY_ROWS = generateRows(50);

const meta: Meta<typeof DataGrid> = {
  title: 'Components/DataGrid',
  component: DataGrid,
  tags: ['autodocs'],
  argTypes: {
    sortable: { control: 'boolean' },
    filterable: { control: 'boolean' },
    pagination: { control: 'boolean' },
    paginationPageSize: { control: { type: 'number', min: 5, max: 100, step: 5 } },
    resizable: { control: 'boolean' },
    customColumnWidths: { control: 'boolean' },
    rowSelection: {
      control: 'select',
      options: ['single', 'multiple', 'none'],
    },
    disableRowSelection: { control: 'boolean' },
    hideHorizontalScrollbar: { control: 'boolean' },
    hideVerticalScrollbar: { control: 'boolean' },
    showPinnedColumnGradient: { control: 'boolean' },
    tightLetterSpacing: { control: 'boolean' },
    isDark: { control: 'boolean' },
    noRowsToShow: { control: 'text' },
    height: { control: 'text' },
    width: { control: 'text' },
    // 복합 객체 / 함수 prop 은 controls 생략, args 로만 주입.
    columnDefs: { control: false },
    rowData: { control: false },
    defaultColDef: { control: false },
    gridOptions: { control: false },
    defaultSortState: { control: false },
    components: { control: false },
    paginationPageSizeSelector: { control: false },
    suppressPaginationPanel: { control: false },
    visibleColumnCount: { control: false },
    onGridReady: { action: 'gridReady' },
    onSortChanged: { action: 'sortChanged' },
    onHeaderButtonLeftClick: { action: 'headerLeftClick' },
    onHeaderButtonRightClick: { action: 'headerRightClick' },
  },
  args: {
    columnDefs: BASIC_COLUMNS,
    rowData: TEN_ROWS,
    sortable: false,
    filterable: false,
    pagination: false,
    resizable: true,
    rowSelection: 'single',
    height: 400,
    width: '100%',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 16, minHeight: 440 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DataGrid>;

/** 기본 — 10행 / 단일 선택. */
export const Default: Story = {};

/** 많은 행 — 50개 데이터. */
export const ManyRows: Story = {
  args: {
    rowData: FIFTY_ROWS,
    height: 480,
  },
};

/** 정렬 가능. */
export const Sortable: Story = {
  args: {
    sortable: true,
    columnDefs: FULL_COLUMNS,
    rowData: FIFTY_ROWS,
  },
};

/** 필터 가능 (floating filter 헤더 표시). */
export const Filterable: Story = {
  args: {
    filterable: true,
    sortable: true,
    columnDefs: FULL_COLUMNS,
    rowData: FIFTY_ROWS,
    height: 480,
  },
};

/** 페이지네이션 — 10개씩. */
export const Paginated: Story = {
  args: {
    pagination: true,
    paginationPageSize: 10,
    columnDefs: FULL_COLUMNS,
    rowData: FIFTY_ROWS,
    height: 480,
  },
};

/** 다중 선택 (체크박스 없이 클릭 기반). */
export const MultiSelect: Story = {
  args: {
    rowSelection: 'multiple',
    columnDefs: FULL_COLUMNS,
    rowData: TEN_ROWS,
  },
};

/** 선택 비활성. */
export const NoSelection: Story = {
  args: {
    disableRowSelection: true,
    rowData: TEN_ROWS,
  },
};

/** 빈 상태 — 커스텀 안내 문구. */
export const Empty: Story = {
  args: {
    rowData: [],
    noRowsToShow: '표시할 데이터가 없습니다. 필터를 조정해보세요.',
  },
};

/** 기본 정렬 상태 — score 내림차순. */
export const WithDefaultSort: Story = {
  args: {
    sortable: true,
    columnDefs: FULL_COLUMNS,
    rowData: FIFTY_ROWS,
    defaultSortState: [{ colId: 'score', sort: 'desc' }],
    height: 480,
  },
};

/** 다크 테마. */
export const DarkTheme: Story = {
  args: {
    isDark: true,
    columnDefs: FULL_COLUMNS,
    rowData: TEN_ROWS,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 16, background: '#111827', minHeight: 440 }}>
        <Story />
      </div>
    ),
  ],
};
