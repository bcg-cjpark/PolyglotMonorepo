import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import type { MenuItemType } from './Menu';
import { Button } from '#/components/Button';
import { IconButton } from '#/components/IconButton';

/**
 * `Menu` 는 Headless UI 기반의 드롭다운 메뉴입니다. 트리거는 `children` 슬롯으로
 * 임의의 요소를 쓸 수 있고, 아이템 배열은 `items` 로 전달합니다. 열림/닫힘 상태는
 * Headless UI 내부에서 관리됩니다.
 */
const BASIC_ITEMS: MenuItemType[] = [
  { label: '프로필', value: 'profile' },
  { label: '설정', value: 'settings' },
  { label: '로그아웃', value: 'logout' },
];

const ICON_ITEMS: MenuItemType[] = [
  { label: '홈', icon: 'home', value: 'home' },
  { label: '설정', icon: 'settings', value: 'settings' },
  { label: '알림', icon: 'notification', value: 'noti' },
  { label: '검색', icon: 'search', value: 'search' },
];

const ACTION_ITEMS: MenuItemType[] = [
  { label: '편집', icon: 'edit', value: 'edit' },
  { label: '복사', icon: 'copy', value: 'copy' },
  { label: '삭제', icon: 'trash', value: 'delete' },
];

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    showIcons: { control: 'boolean' },
    menuWidth: { control: { type: 'number', min: 120, max: 320, step: 10 } },
    itemsClass: { control: 'text' },
    items: { control: false },
    children: { control: false },
    prepend: { control: false },
    onSelect: { action: 'selected' },
  },
  args: {
    items: BASIC_ITEMS,
    showIcons: false,
    menuWidth: 180,
    align: 'center',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Menu>;

/** 기본 — 텍스트만, 센터 정렬. */
export const Default: Story = {
  render: (args) => (
    <Menu {...args}>
      <Button label="메뉴 열기" variant="contained" />
    </Menu>
  ),
};

/** 아이콘 포함. */
export const WithIcons: Story = {
  args: { items: ICON_ITEMS, showIcons: true, menuWidth: 200 },
  render: (args) => (
    <Menu {...args}>
      <Button label="내비게이션" variant="outlined" />
    </Menu>
  ),
};

/** 좌측 정렬 — 트리거 왼쪽 기준. */
export const AlignLeft: Story = {
  args: { align: 'left', items: ACTION_ITEMS, showIcons: true },
  render: (args) => (
    <Menu {...args}>
      <Button label="작업" variant="outlined" />
    </Menu>
  ),
};

/** 우측 정렬 — 트리거 오른쪽 기준. */
export const AlignRight: Story = {
  args: { align: 'right', items: ACTION_ITEMS, showIcons: true },
  render: (args) => (
    <Menu {...args}>
      <Button label="작업" variant="outlined" />
    </Menu>
  ),
};

/** 아이콘 버튼 트리거. */
export const IconButtonTrigger: Story = {
  args: { items: ACTION_ITEMS, showIcons: true, align: 'right' },
  render: (args) => (
    <Menu {...args}>
      <IconButton icon={{ name: 'more vert' }} shape="square" />
    </Menu>
  ),
};

/** prepend 영역 — 헤더/상단 고정 영역. */
export const WithPrepend: Story = {
  args: {
    items: BASIC_ITEMS,
    menuWidth: 220,
    prepend: (
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          fontSize: 12,
          color: '#6b7280',
        }}
      >
        <div style={{ fontWeight: 600, color: '#111827' }}>김민수</div>
        <div>kim@example.com</div>
      </div>
    ),
  },
  render: (args) => (
    <Menu {...args}>
      <Button label="계정" variant="outlined" />
    </Menu>
  ),
};

/** 넓은 메뉴 너비. */
export const WideMenu: Story = {
  args: { items: ICON_ITEMS, showIcons: true, menuWidth: 280 },
  render: (args) => (
    <Menu {...args}>
      <Button label="와이드 메뉴" variant="contained" />
    </Menu>
  ),
};
