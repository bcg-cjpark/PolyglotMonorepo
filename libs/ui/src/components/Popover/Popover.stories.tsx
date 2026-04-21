import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from './Popover';
import { Button } from '#/components/Button';

/**
 * `Popover` 는 Headless UI 기반의 팝오버입니다. 트리거는 `children` 또는
 * `renderTrigger({ open })` 으로, 컨텐츠는 `renderContent({ open, close })`
 * 로 주입합니다. 열림/닫힘 상태는 Headless UI 내부에서 관리됩니다.
 */
const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top',
        'top-left',
        'top-right',
        'bottom',
        'bottom-left',
        'bottom-right',
        'left',
        'right',
      ],
    },
    panelClass: { control: 'text' },
    renderTrigger: { control: false },
    renderContent: { control: false },
    children: { control: false },
  },
  args: {
    position: 'bottom',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 120, display: 'flex', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Popover>;

const DefaultPanel = ({ close }: { close: () => void }) => (
  <div
    style={{
      padding: 16,
      width: 240,
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>팝오버 제목</h3>
    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
      트리거 주변에 떠 있는 팝오버 컨텐츠입니다.
    </p>
    <Button label="닫기" variant="outlined" size="sm" onClick={close} />
  </div>
);

/** 기본 — 하단 중앙. */
export const Default: Story = {
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="팝오버 열기" variant="contained" />
    </Popover>
  ),
};

/** 상단 중앙. */
export const Top: Story = {
  args: { position: 'top' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="위로 열기" variant="outlined" />
    </Popover>
  ),
};

/** 좌측. */
export const Left: Story = {
  args: { position: 'left' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="왼쪽 열기" variant="outlined" />
    </Popover>
  ),
};

/** 우측. */
export const Right: Story = {
  args: { position: 'right' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="오른쪽 열기" variant="outlined" />
    </Popover>
  ),
};

/** 하단 좌측 정렬. */
export const BottomLeft: Story = {
  args: { position: 'bottom-left' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="아래-왼쪽" variant="outlined" />
    </Popover>
  ),
};

/** 하단 우측 정렬. */
export const BottomRight: Story = {
  args: { position: 'bottom-right' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    >
      <Button label="아래-오른쪽" variant="outlined" />
    </Popover>
  ),
};

/** renderTrigger 사용 — open 상태를 받아 트리거 모양을 바꿈. */
export const DynamicTrigger: Story = {
  render: (args) => (
    <Popover
      {...args}
      renderTrigger={({ open }) => (
        <Button
          label={open ? '열림' : '닫힘 — 클릭'}
          variant={open ? 'contained' : 'outlined'}
          color={open ? 'blue' : 'primary'}
        />
      )}
      renderContent={({ close }) => <DefaultPanel close={close} />}
    />
  ),
};

/** 리치 컨텐츠 — 폼 형태. */
export const RichContent: Story = {
  args: { position: 'bottom-left' },
  render: (args) => (
    <Popover
      {...args}
      renderContent={({ close }) => (
        <div
          style={{
            padding: 16,
            width: 280,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>필터</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13 }}>
              <input type="checkbox" defaultChecked /> 활성 항목만
            </label>
            <label style={{ fontSize: 13 }}>
              <input type="checkbox" /> 즐겨찾기
            </label>
            <label style={{ fontSize: 13 }}>
              <input type="checkbox" /> 최근 7일
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button label="초기화" variant="outlined" size="sm" fullWidth />
            <Button label="적용" variant="contained" size="sm" fullWidth onClick={close} />
          </div>
        </div>
      )}
    >
      <Button label="필터 열기" variant="outlined" />
    </Popover>
  ),
};
