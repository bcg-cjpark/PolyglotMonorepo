import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#/components/Button';
import { IconButton } from '#/components/IconButton';
import { Table } from './Table';
import type { TableColumn } from './Table';

/**
 * `Table` 은 정형 스키마(고정 컬럼) 중·소량 데이터용 primitive 입니다.
 *
 * API 가 작아 스토리도 간소합니다 — 기본 렌더, 커스텀 `render`, 행별 액션 주입,
 * 정렬/너비, 빈 상태, 다크 테마 변형 여섯 가지만 제공합니다.
 *
 * 정렬·필터·페이지네이션·행 선택·가상화는 의도적으로 제공되지 않습니다.
 * (자세한 경계는 `docs/design-notes/data-display.md` 참조.)
 */

// 스토리 공용 샘플 데이터 -------------------------------------------------
type SampleUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

const sampleUsers = [
  { id: 1, name: '김민수', email: 'minsu.kim@example.com', createdAt: '2026-01-03' },
  { id: 2, name: '이서연', email: 'seoyeon.lee@example.com', createdAt: '2026-01-15' },
  { id: 3, name: '박지호', email: 'jiho.park@example.com', createdAt: '2026-02-02' },
  { id: 4, name: '최예은', email: 'yeeun.choi@example.com', createdAt: '2026-02-21' },
  { id: 5, name: '정도윤', email: 'doyun.jung@example.com', createdAt: '2026-03-08' },
  { id: 6, name: '강하은', email: 'haeun.kang@example.com', createdAt: '2026-03-27' },
] as const satisfies ReadonlyArray<SampleUser>;

// row key helper — 모든 스토리에서 공통으로 사용.
const getUserRowKey = (row: SampleUser) => row.id;

// 날짜 포매팅 헬퍼 — WithCustomRender 용.
const formatDateKR = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

// Meta -----------------------------------------------------------------
const meta: Meta<typeof Table<SampleUser>> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    // 복합 객체 / 함수 prop 은 control 없이 args 로만 주입.
    columns: { control: false },
    rows: { control: false },
    getRowKey: { control: false },
    emptyMessage: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    rows: sampleUsers,
    getRowKey: getUserRowKey,
  },
};

export default meta;
type Story = StoryObj<typeof Table<SampleUser>>;

// Stories --------------------------------------------------------------

/** 기본 — id / 이름 / 이메일 3 컬럼. `render` 없이 `row[key]` 자동 렌더 경로. */
export const Default: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'name', header: '이름' },
      { key: 'email', header: '이메일' },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
  },
};

/** 커스텀 렌더 — email 은 `mailto:` 앵커, 날짜는 한국어 포매팅. */
export const WithCustomRender: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'name', header: '이름' },
      {
        key: 'email',
        header: '이메일',
        render: (row) => (
          <a
            href={`mailto:${row.email}`}
            style={{ color: 'var(--font-color-primary)', textDecoration: 'underline' }}
          >
            {row.email}
          </a>
        ),
      },
      {
        key: 'createdAt',
        header: '가입일',
        render: (row) => formatDateKR(row.createdAt),
      },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
  },
};

/**
 * 행별 액션 — `render` 콜백 안에 `@monorepo/ui` primitive 를 주입.
 * 문서 §5 "액션 셀 자유 주입" 규약 시연용.
 */
export const WithActions: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'name', header: '이름' },
      { key: 'email', header: '이메일' },
      {
        key: 'actions',
        header: '관리',
        align: 'right',
        width: '160px',
        render: (row) => (
          <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
            <IconButton
              icon={{ name: 'edit' }}
              size="sm"
              shape="square"
              ariaLabel={`${row.name} 편집`}
            />
            <Button
              label="삭제"
              size="sm"
              variant="outlined"
              color="red"
            />
          </div>
        ),
      },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
  },
};

/**
 * 정렬 / 너비 — 같은 데이터를 left / center / right 세 컬럼으로 배치.
 * `width` 에 고정 px 과 % 를 섞어 사용.
 */
export const Alignment: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID (좌)', align: 'left', width: '120px' },
      { key: 'name', header: '이름 (중앙)', align: 'center', width: '30%' },
      { key: 'email', header: '이메일 (우)', align: 'right' },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
  },
};

/** 빈 상태 — rows=[] + 커스텀 `emptyMessage`. 헤더는 유지됨. */
export const Empty: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'name', header: '이름' },
      { key: 'email', header: '이메일' },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
    rows: [],
    emptyMessage: '등록된 사용자가 없습니다',
  },
};

/**
 * 다크 테마 — `.storybook/preview.ts` 의 `globalTypes.theme` 토글을
 * 스토리 레벨에서 'dark' 로 고정. Table.scss 는 `:root[data-theme=...]` 기반
 * 토큰 스위칭이라 페이지가 dark 로 바뀌기만 하면 자동 대응한다.
 *
 * (툴바로도 수동 토글 가능. 이 스토리는 기본값만 dark 로 고정.)
 */
export const Dark: Story = {
  args: {
    columns: [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'name', header: '이름' },
      { key: 'email', header: '이메일' },
      {
        key: 'createdAt',
        header: '가입일',
        render: (row) => formatDateKR(row.createdAt),
      },
    ] satisfies ReadonlyArray<TableColumn<SampleUser>>,
  },
  globals: {
    theme: 'dark',
  },
};
